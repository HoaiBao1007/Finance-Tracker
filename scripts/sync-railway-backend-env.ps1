param(
    [Parameter(Mandatory = $true)]
    [string]$EnvFilePath,

    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [Parameter(Mandatory = $true)]
    [string]$EnvironmentId,

    [string]$ServiceName = "api"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-EnvMap {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "Env file not found: $Path"
    }

    $map = @{}

    foreach ($rawLine in Get-Content $Path) {
        $line = $rawLine.Trim()

        if (-not $line -or $line.StartsWith("#")) {
            continue
        }

        if ($line -notmatch "^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$") {
            continue
        }

        $key = $Matches[1]
        $value = $Matches[2].Trim()

        if ($value.Length -ge 2) {
            $hasDoubleQuotes = $value.StartsWith('"') -and $value.EndsWith('"')
            $hasSingleQuotes = $value.StartsWith("'") -and $value.EndsWith("'")

            if ($hasDoubleQuotes -or $hasSingleQuotes) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        }

        $map[$key] = $value
    }

    if (-not $map.ContainsKey("EMAIL_PROVIDER")) {
        $map["EMAIL_PROVIDER"] = "smtp"
    }

    if (-not $map.ContainsKey("MAIL_FROM_EMAIL") -and $map.ContainsKey("SMTP_FROM_EMAIL")) {
        $map["MAIL_FROM_EMAIL"] = $map["SMTP_FROM_EMAIL"]
    }

    if (-not $map.ContainsKey("MAIL_FROM_NAME")) {
        if ($map.ContainsKey("SMTP_FROM_NAME")) {
            $map["MAIL_FROM_NAME"] = $map["SMTP_FROM_NAME"]
        }
        else {
            $map["MAIL_FROM_NAME"] = "Finance Tracker"
        }
    }

    return $map
}

function Get-RequiredKeys {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$EnvMap
    )

    $baseKeys = @(
        "NODE_ENV",
        "PORT",
        "DATABASE_URL",
        "DIRECT_URL",
        "JWT_SECRET",
        "JWT_EXPIRES_IN",
        "CLIENT_ORIGIN",
        "EMAIL_PROVIDER",
        "MAIL_FROM_EMAIL",
        "MAIL_FROM_NAME",
        "ALLOW_LOCAL_SMTP",
        "PASSWORD_RESET_OTP_EXPIRES_MINUTES"
    )

    $emailProvider = "smtp"

    if ($EnvMap.ContainsKey("EMAIL_PROVIDER") -and $EnvMap["EMAIL_PROVIDER"]) {
        $emailProvider = $EnvMap["EMAIL_PROVIDER"].Trim().ToLowerInvariant()
    }

    switch ($emailProvider) {
        "resend" {
            return $baseKeys + @(
                "RESEND_API_KEY"
            )
        }

        "smtp" {
            return $baseKeys + @(
                "SMTP_HOST",
                "SMTP_PORT",
                "SMTP_SECURE"
            )
        }

        default {
            throw "Unsupported EMAIL_PROVIDER '$emailProvider'. Expected 'smtp' or 'resend'."
        }
    }
}

function Assert-ProviderSpecificConstraints {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$EnvMap
    )

    $emailProvider = $EnvMap["EMAIL_PROVIDER"].Trim().ToLowerInvariant()

    if ($emailProvider -eq "smtp") {
        $hasSmtpUser = $EnvMap.ContainsKey("SMTP_USER") -and -not [string]::IsNullOrWhiteSpace($EnvMap["SMTP_USER"])
        $hasSmtpPass = $EnvMap.ContainsKey("SMTP_PASS") -and -not [string]::IsNullOrWhiteSpace($EnvMap["SMTP_PASS"])

        if ($hasSmtpUser -xor $hasSmtpPass) {
            throw "SMTP_USER and SMTP_PASS must be provided together when EMAIL_PROVIDER=smtp"
        }
    }
}

function Set-RailwayVariable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Key,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value,

        [Parameter(Mandatory = $true)]
        [string]$Project,

        [Parameter(Mandatory = $true)]
        [string]$Environment,

        [Parameter(Mandatory = $true)]
        [string]$Service
    )

    $railwayArgs = @(
        "-y",
        "@railway/cli@latest",
        "variable",
        "set",
        $Key,
        "--stdin",
        "--project",
        $Project,
        "--environment",
        $Environment,
        "--service",
        $Service,
        "--skip-deploys"
    )

    $Value | & npx.cmd @railwayArgs | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to set Railway variable: $Key"
    }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedEnvFilePath = (Resolve-Path $EnvFilePath).Path

$envMap = Get-EnvMap -Path $resolvedEnvFilePath
$requiredKeys = @(Get-RequiredKeys -EnvMap $envMap)
Assert-ProviderSpecificConstraints -EnvMap $envMap
$missingKeys = @($requiredKeys | Where-Object { $_ -notin $envMap.Keys })

if ($missingKeys.Count -gt 0) {
    throw "Missing required keys in env file: $($missingKeys -join ', ')"
}

Write-Host "Syncing backend variables to Railway service '$ServiceName' in environment '$EnvironmentId'..."

foreach ($key in ($envMap.Keys | Sort-Object)) {
    Write-Host "Setting $key"
    Set-RailwayVariable -Key $key -Value $envMap[$key] -Project $ProjectId -Environment $EnvironmentId -Service $ServiceName
}

Write-Host "Railway backend environment sync completed."