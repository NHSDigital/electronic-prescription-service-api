function die (){
  echo "$1" 1>&2
  exit 1
}

echo "> Installing terraform"
source .profile

echo "> Installing terraform 1.0.0"
tfenv install 1.0.0
[ $? -ne 0 ] && die "Failed to install terraform 1.0.0";

echo "> Installing terraform 1.3.4"
tfenv install 1.3.4
[ $? -ne 0 ] && die "Failed to install terraform 1.3.4";

echo "> Set default terraform to 1.3.4"
tfenv use 1.3.4
[ $? -ne 0 ] && die "Failed to set default terraform";

# Got this far? Then we are good
echo "Finished running $(basename "$0")"
exit 0;
