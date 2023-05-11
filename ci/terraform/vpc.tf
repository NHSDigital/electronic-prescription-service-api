resource "aws_vpc" "github_runner" {
  cidr_block = local.vpc_cidr

  tags = {
    Name = "${local.prefix}--github-runner"
  }
}

###########
# SUBNETS #
###########
module "private_subnets" {
  source      = "./vpc-subnets"
  vpc_id      = aws_vpc.github_runner.id
  name_prefix = "${local.prefix}--github-runner-private"
  cidr_prefix = local.vpc_cidr
  networks = {
    private_a = {
      netnum            = 1,
      availability_zone = "eu-west-2a"
    }
    private_b = {
      netnum            = 2,
      availability_zone = "eu-west-2b"
    }
    private_c = {
      netnum            = 3,
      availability_zone = "eu-west-2c"
    }
  }
}

module "public_subnets" {
  source      = "./vpc-subnets"
  vpc_id      = aws_vpc.github_runner.id
  name_prefix = "${local.prefix}--github-runner-public"
  cidr_prefix = local.vpc_cidr
  networks = {
    public_a = {
      netnum            = 4,
      availability_zone = "eu-west-2a"
    }
    public_b = {
      netnum            = 5,
      availability_zone = "eu-west-2b"
    }
    public_c = {
      netnum            = 6,
      availability_zone = "eu-west-2c"
    }
  }
}

#################
# PUBLIC SUBNET #
#################
resource "aws_internet_gateway" "github_runner" {
  vpc_id = aws_vpc.github_runner.id

  tags = {
    Name = "${local.prefix}--github-runner-igw"
  }
}

resource "aws_route_table" "github_runner_nat_gateway_to_internet" {
  vpc_id = aws_vpc.github_runner.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.github_runner.id
  }

  tags = {
    Name = "${local.prefix}--github-runner-natgw-to-internet"
  }
}

resource "aws_route_table_association" "public_subnet_a" {
  subnet_id      = module.public_subnets.ids["public_a"]
  route_table_id = aws_route_table.github_runner_nat_gateway_to_internet.id
}

resource "aws_route_table_association" "public_subnet_b" {
  subnet_id      = module.public_subnets.ids["public_b"]
  route_table_id = aws_route_table.github_runner_nat_gateway_to_internet.id
}

resource "aws_route_table_association" "public_subnet_c" {
  subnet_id      = module.public_subnets.ids["public_c"]
  route_table_id = aws_route_table.github_runner_nat_gateway_to_internet.id
}

module "github_runner_natgw_a" {
  source    = "./nat-gateway"
  vpc_id    = aws_vpc.github_runner.id
  name      = "${local.prefix}--github-runner-natgw-a"
  subnet_id = module.public_subnets.ids["public_a"]
}

module "github_runner_natgw_b" {
  source    = "./nat-gateway"
  vpc_id    = aws_vpc.github_runner.id
  name      = "${local.prefix}--github-runner-natgw-b"
  subnet_id = module.public_subnets.ids["public_b"]
}

module "github_runner_natgw_c" {
  source    = "./nat-gateway"
  vpc_id    = aws_vpc.github_runner.id
  name      = "${local.prefix}--github-runner-natgw-b"
  subnet_id = module.public_subnets.ids["public_c"]
}


##################
# PRIVATE SUBNET #
##################
resource "aws_route_table_association" "private_subnet_a" {
  subnet_id      = module.private_subnets.ids["private_a"]
  route_table_id = module.github_runner_natgw_a.route_table_id
}

resource "aws_route_table_association" "private_subnet_b" {
  subnet_id      = module.private_subnets.ids["private_b"]
  route_table_id = module.github_runner_natgw_b.route_table_id
}

resource "aws_route_table_association" "private_subnet_c" {
  subnet_id      = module.private_subnets.ids["private_c"]
  route_table_id = module.github_runner_natgw_c.route_table_id
}
