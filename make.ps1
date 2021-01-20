# notepad $profile
function make([string]$make_command)
{
    Invoke-Expression ". .\make.ps1; $make_command"
}

function update-prescriptions
{
    ./scripts/update_prescriptions.ps1
}