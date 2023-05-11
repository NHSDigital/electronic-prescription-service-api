function die (){
  echo "$1" 1>&2
  exit 1
}

echo "> Installing python"
source .profile

echo "> Installing python 3.9.15"
pyenv install 3.9.15
[ $? -ne 0 ] && die "Failed to install python 3.9.15";

echo "> Installing poetry for python 3.9.15"
pyenv global 3.9.15
pip install poetry
[ $? -ne 0 ] && die "Failed to install poetry";
pyenv global system

# Got this far? Then we are good
echo "Finished running $(basename "$0")"
exit 0;
