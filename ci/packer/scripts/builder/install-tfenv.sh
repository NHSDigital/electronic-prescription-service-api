function die (){
  echo "$1" 1>&2
  exit 1
}

echo "> Installing tfenv"
git clone https://github.com/tfutils/tfenv.git /home/ubuntu/.tfenv
[ $? -ne 0 ] && die "Failed to install tfenv"

echo "> Adding tfenv to path"
echo 'export PATH="/home/ubuntu/.tfenv/bin:$PATH"' >> /home/ubuntu/.bash_profile
echo 'export PATH="/home/ubuntu/.tfenv/bin:$PATH"' >> /home/ubuntu/.bashrc
echo 'export PATH="/home/ubuntu/.tfenv/bin:$PATH"' >> /home/ubuntu/.profile
[ $? -ne 0 ] && die "Failed to add tfenv to path";

# Got this far? Then we are good
echo "Finished running $(basename "$0")"
exit 0;
