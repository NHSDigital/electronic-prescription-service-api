resource "aws_subnet" "subnet" {
  for_each   = var.networks
  cidr_block = cidrsubnet(var.cidr_prefix, 8, each.value["netnum"])
  vpc_id     = var.vpc_id

  availability_zone = each.value["availability_zone"]

  tags = {
    Name = "${var.name_prefix}-${each.value["availability_zone"]}"
  }
}
