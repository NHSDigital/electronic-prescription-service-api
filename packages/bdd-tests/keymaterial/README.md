# Taken from https://helpcenter.gsx.com/hc/en-us/articles/115015960428-How-to-Generate-a-Self-Signed-Certificate-and-Private-Key-using-OpenSSL#:~:text=Right%2Dclick%20the%20openssl.exe,rsa%3A2048%20%2Dkeyout%20privateKey.

openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout privateKey.key -out certificate.crt

openssl x509 -in certificate.crt -out certificate.pem
