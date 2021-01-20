# Run the command below to add make facade commands to powershell: 
# . .\make.ps1

function make() { 
    $make_args = $args[0..($args.count-2)]
    $make_command = $args[-1]
    Invoke-Expression ". .\make.ps1; $make_command $make_args" 
}

function update-prescriptions() {
    foreach ($arg in $args) {
        $split_args = $arg.Split("=")
        $arg_name = $split_args[0]
        $arg_value = $split_args[1]
        Invoke-Expression `$$arg_name="""$arg_value"""
        if ($arg_name -eq "pr") {
            $pr_prefix="-pr-"
        }
    }
    ./scripts/update-prescriptions.ps1
}