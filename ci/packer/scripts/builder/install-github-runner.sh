function die (){
  echo "$1" 1>&2
  exit 1
}

echo "> Create github runner folder"
mkdir actions-runner && cd actions-runner
[ $? -ne 0 ] && die "Failed to create github runner folder";

echo "> Downloading github runner binary"
curl -o actions-runner-linux-x64-2.304.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.304.0/actions-runner-linux-x64-2.304.0.tar.gz
[ $? -ne 0 ] && die "Failed to download github runner binary";

echo "> Checking github runner binary shasum"
echo "292e8770bdeafca135c2c06cd5426f9dda49a775568f45fcc25cc2b576afc12f  actions-runner-linux-x64-2.304.0.tar.gz" | shasum -a 256 -c
[ $? -ne 0 ] && die "Shasum check failed";

echo "> Extracting github runner binary"
tar xzf ./actions-runner-linux-x64-2.304.0.tar.gz
[ $? -ne 0 ] && die "Failed to extract binary";

# Got this far? Then we are good
echo "Finished running $(basename "$0")"
exit 0;
