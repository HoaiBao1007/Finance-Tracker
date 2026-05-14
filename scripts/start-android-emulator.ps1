param(
  [switch]$ListOnly,
  [string]$AvdName
)

$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$emulatorPath = Join-Path $sdkRoot 'emulator\emulator.exe'
$adbPath = Join-Path $sdkRoot 'platform-tools\adb.exe'

function Get-RunningAndroidEmulators {
  param(
    [string]$AdbExecutable
  )

  if (-not (Test-Path $AdbExecutable)) {
    return @()
  }

  $deviceLines = @(& $AdbExecutable devices | Select-Object -Skip 1)
  $running = @()

  foreach ($line in $deviceLines) {
    if ($line -match '^(emulator-\d+)\s+device$') {
      $serial = $matches[1]
      $resolvedAvdName = (& $AdbExecutable -s $serial emu avd name 2>$null | Select-Object -First 1).Trim()

      $running += [pscustomobject]@{
        Serial = $serial
        AvdName = $resolvedAvdName
      }
    }
  }

  return $running
}

if (-not (Test-Path $emulatorPath)) {
  $message = "Khong tim thay Android emulator trong SDK path: $sdkRoot"

  if ($ListOnly) {
    Write-Output $message
    exit 0
  }

  Write-Error $message
  exit 1
}

$avdList = @(& $emulatorPath -list-avds | Where-Object { $_ -and $_.Trim().Length -gt 0 })
$runningEmulators = Get-RunningAndroidEmulators -AdbExecutable $adbPath

if ($ListOnly) {
  Write-Output "Android SDK: $sdkRoot"

  if ($avdList.Count -eq 0) {
    Write-Output 'Khong co AVD nao tren may nay. Mo Android Studio > Device Manager > Create Device de tao emulator dau tien.'
  } else {
    Write-Output 'Danh sach AVD hien co:'
    $avdList | ForEach-Object { Write-Output "- $_" }
  }

  if ($runningEmulators.Count -gt 0) {
    Write-Output 'Emulator dang chay:'
    $runningEmulators | ForEach-Object { Write-Output "- $($_.AvdName) [$($_.Serial)]" }
  }

  if (Test-Path $adbPath) {
    & $adbPath devices
  } else {
    Write-Output 'Khong tim thay adb.exe trong Android SDK.'
  }

  exit 0
}

if ($avdList.Count -eq 0) {
  Write-Error 'Chua co AVD nao. Hay tao emulator trong Android Studio > Device Manager truoc khi chay tu VS Code.'
  exit 1
}

if (-not $AvdName) {
  $AvdName = $avdList[0]
}

if ($avdList -notcontains $AvdName) {
  Write-Error "Khong tim thay AVD '$AvdName'. Chay task Android Setup Status de xem danh sach AVD hien co."
  exit 1
}

$runningTarget = $runningEmulators | Where-Object { $_.AvdName -eq $AvdName } | Select-Object -First 1

if ($runningTarget) {
  Write-Output "Emulator da dang chay: $($runningTarget.AvdName) [$($runningTarget.Serial)]"
  exit 0
}

Write-Output "Dang mo emulator: $AvdName"
Start-Process -FilePath $emulatorPath -ArgumentList @('-avd', $AvdName)

if (Test-Path $adbPath) {
  & $adbPath start-server | Out-Null
}

Write-Output 'Da gui lenh khoi dong emulator. Sau khi emulator boot xong, chay Finance Tracker: Mobile Android hoac task Mobile Android trong VS Code.'