//import * as crypto from "crypto";
//const crypto = require("crypto");


let price1 = this.price;
function Pen(name, color) {
  const crypto = require("crypto");
  this.name = name;
  this.color = color;
  this.pic = crypto.randomUUID()

}

const pen1 = new Pen("Marker", "Blue");
console.log(pen1);
//pen1 = new Pen("Marker", "Blue");
 console.log(pen1);

let lastNumber // start with undefined lastNumber

function getRandNumber() {
  const crypto = require("crypto");
  let x = crypto.randomUUID(); // get new random number

  if (x === lastNumber) { // compare with last number
    return getRandNumber() // if they are the same, call the function again to repeat the process
  }
  return x // if they're not the same, return it
}
function myFunction() {
  const number = getRandNumber()
  lastNumber = number
  return number;


}
let a = myFunction()
console.log(a );
console.log(a );


