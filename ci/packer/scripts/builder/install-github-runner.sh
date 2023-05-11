function die (){
  echo "$1" 1>&2
  exit 1
}

echo "> Create github runner folder"
mkdir actions-runner && cd actions-runner
[ $? -ne 0 ] && die "Failed to create github runner folder";

echo "> Downloading github runner binary"
curl -o actions-runner-linux-x64-2.299.1.tar.gz -L https://github.com/actions/runner/releases/download/v2.299.1/actions-runner-linux-x64-2.299.1.tar.gz
[ $? -ne 0 ] && die "Failed to download github runner binary";

echo "> Checking github runner binary shasum"
echo "147c14700c6cb997421b9a239c012197f11ea9854cd901ee88ead6fe73a72c74  actions-runner-linux-x64-2.299.1.tar.gz" | shasum -a 256 -c
[ $? -ne 0 ] && die "Shasum check failed";

echo "> Extracting github runner binary"
tar xzf ./actions-runner-linux-x64-2.299.1.tar.gz
[ $? -ne 0 ] && die "Failed to extract binary";

# Got this far? Then we are good
echo "Finished running $(basename "$0")"
exit 0;
