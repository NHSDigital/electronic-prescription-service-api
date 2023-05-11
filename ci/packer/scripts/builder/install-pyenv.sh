function die (){
  echo "$1" 1>&2
  exit 1
}

echo "> Installing pyenv"
git clone https://github.com/pyenv/pyenv.git /home/ubuntu/.pyenv
[ $? -ne 0 ] && die "Failed to install pyenv";

echo "> Adding pyenv env vars to .bashrc, .bash_profile and .profile"
echo 'export PYENV_ROOT="/home/ubuntu/.pyenv"' >> /home/ubuntu/.bashrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> /home/ubuntu/.bashrc
echo 'eval "$(pyenv init -)"' >> /home/ubuntu/.bashrc

echo 'export PYENV_ROOT="/home/ubuntu/.pyenv"' >> /home/ubuntu/.bash_profile
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> /home/ubuntu/.bash_profile
echo 'eval "$(pyenv init -)"' >> /home/ubuntu/.bash_profile

echo 'export PYENV_ROOT="/home/ubuntu/.pyenv"' >> /home/ubuntu/.profile
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> /home/ubuntu/.profile
echo 'eval "$(pyenv init -)"' >> /home/ubuntu/.profile
[ $? -ne 0 ] && die "Failed to add pyenv env vars";

# Got this far? Then we are good
echo "Finished running $(basename "$0")"
exit 0;
