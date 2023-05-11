resource "aws_eip" "nat_gateway" {
  vpc = true
  tags = {
    Name = var.name
  }
}

resource "aws_nat_gateway" "nat_gateway" {
  allocation_id = aws_eip.nat_gateway.id
  subnet_id     = var.subnet_id
  tags = {
    Name = var.name
  }
}

resource "aws_route_table" "instance_to_nat_gateway" {
  vpc_id = var.vpc_id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway.id
  }
  tags = {
    Name = var.name
  }
}
