function parse(request) 
{
  return request.payload || {}
}

module.exports = {
  parse
}