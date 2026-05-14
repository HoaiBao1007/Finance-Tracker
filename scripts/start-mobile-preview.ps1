param(
  [string]$AvdName,
  [int]$PreferredPort = 8081,
  [int]$MaxPort = 8090
)

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$mobilePath = Join-Path $workspaceRoot 'mobile'
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$adbPath = Join-Path $sdkRoot 'platform-tools\adb.exe'
$startEmulatorScript = Join-Path $PSScriptRoot 'start-android-emulator.ps1'

function Get-AvailableExpoPort {
  param(
    [int]$StartPort,
    [int]$EndPort
  )

  $activePorts = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners().Port

  for ($port = $StartPort; $port -le $EndPort; $port++) {
    if ($activePorts -notcontains $port) {
      return $port
    }
  }

  throw "Khong tim duoc cong trong tu $StartPort den $EndPort cho Expo."
}

if (-not (Test-Path $mobilePath)) {
  Write-Error "Khong tim thay thu muc mobile: $mobilePath"
  exit 1
}

if (-not (Test-Path $startEmulatorScript)) {
  Write-Error "Khong tim thay script khoi dong emulator: $startEmulatorScript"
  exit 1
}

$expoPort = Get-AvailableExpoPort -StartPort $PreferredPort -EndPort $MaxPort

if ($expoPort -ne $PreferredPort) {
  Write-Output "Cong $PreferredPort dang duoc su dung. Expo se chay tren cong $expoPort."
}

$startEmulatorArguments = @()

if ($AvdName) {
  $startEmulatorArguments += '-AvdName'
  $startEmulatorArguments += $AvdName
}

& $startEmulatorScript @startEmulatorArguments

if (-not (Test-Path $adbPath)) {
  Write-Error "Khong tim thay adb.exe trong SDK path: $sdkRoot"
  exit 1
}

Write-Output 'Dang doi adb nhan emulator...'
& $adbPath wait-for-device | Out-Null

Push-Location $mobilePath

try {
  Write-Output "Dang chay Expo va mo Android tren cong $expoPort..."
  & npx.cmd expo start --android --port $expoPort
} finally {
  Pop-Location
}