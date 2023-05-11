output "ids" {
  value = { for network in keys(var.networks) : network => aws_subnet.subnet[network].id }
}
