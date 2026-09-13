<#
  Saves whatever image is on the clipboard into public/projects.

  The project screenshots arrive as pasted images, which cannot be
  written to disk from a chat window. Copying one (Ctrl+C on the image,
  or Win+Shift+S to snip) and running this puts it exactly where the
  site expects it, under the name the layout already references.

  Usage:  powershell -File scripts/save-shot.ps1 3m
          powershell -File scripts/save-shot.ps1 castech
          powershell -File scripts/save-shot.ps1 niv
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('3m', 'castech', 'niv')]
  [string]$Name
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$image = [System.Windows.Forms.Clipboard]::GetImage()
if ($null -eq $image) {
  Write-Error "Nenhuma imagem na area de transferencia. Copie a imagem e rode de novo."
  exit 1
}

$dir = Join-Path $PSScriptRoot '..\public\projects'
$path = [System.IO.Path]::GetFullPath((Join-Path $dir "$Name.png"))
$w = $image.Width
$h = $image.Height
$image.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$image.Dispose()

$size = (Get-Item $path).Length
Write-Output "salvo: $path  ($w x $h, $([math]::Round($size/1KB)) KB)"
