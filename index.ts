import * as readline from 'readline';

type bit = 0 | 1;
type binaryData = bit[];
type bitPair = [bit, bit];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const MAX_INPUT_INTEGER = Number.MAX_SAFE_INTEGER;
const MIN_INPUT_INTEGER = Number.MIN_SAFE_INTEGER;

function userEnter(text: string): Promise<string> {
  return new Promise(resolve => rl.question(text, resolve));
}

function halfAdder(...bits: bitPair): bitPair {
  return [
    (bits[0] ^ bits[1]) as bit,
    (bits[0] & bits[1]) as bit,
  ];
}

function fullAdder(carryIn: bit, ...bits: bitPair): bitPair {
  const firstAdderBits = halfAdder(...bits);
  const secondAdderBits = halfAdder(carryIn, firstAdderBits[0]);

  return [
    secondAdderBits[0],
    // carry output
    (secondAdderBits[1] | firstAdderBits[1]) as bit,
  ];
}

function getBinarySum(input1: binaryData, input2: binaryData, bitLength: number): binaryData {
  console.log('getBinarySum args', input1, input2);
  const resultBits: binaryData = [];
  let carryIn: bit = 0;
  let stepsCounter = 0;

  console.time('getBinarySum time');

  for (let i = bitLength - 1; i >= 0 || carryIn === 1; i -= 1, stepsCounter += 1) {
    const bit1 = input1[i] || 0;
    const bit2 = input2[i] || 0;
    console.log('fullAdder step', { i, bit1, bit2, carryIn });
    const [outBit, carryOut] = fullAdder(carryIn, bit1, bit2);
    console.log('fullAdder res', { outBit, carryOut });
    resultBits.unshift(outBit);
    carryIn = carryOut;
  }

  console.log('getBinarySum count steps:', { stepsCounter });
  console.timeEnd('getBinarySum time');

  return resultBits;
}

function getNegativeBits(bits: binaryData): binaryData {
  const length = bits.length;
  const one: binaryData = [...Array(length - 1).fill(0), 1];
  // invert bits
  bits = bits.map(n => Number(!n) as bit);

  // add 1
  return getBinarySum(bits, one, length);
}

function getBinaryInteger(data: string): binaryData {
  const int = parseInt(data, 10);

  if (Number.isNaN(int)) {
    throw new Error('data is not integer');
  }

  if (int < MIN_INPUT_INTEGER || int > MAX_INPUT_INTEGER) {
    throw new Error('invalid integer range');
  }

  const isNegative = int < 0;
  let remainder: bit;
  let res = Math.abs(int);

  const binary: binaryData = [];

  while (res > 0) {
    remainder = (res % 2) as bit;
    res = Math.floor(res / 2);
    binary.unshift(remainder);
  }

  binary.unshift(0); // add bit of sign

  return isNegative ? getNegativeBits(binary) : binary;
}

function signExtension(bits: binaryData, length: number): binaryData {
  const outBits: binaryData = [...bits];
  const diff = length - bits.length;

  if (diff === 0) {
    console.log('signExtension skip diff', bits);
    return outBits;
  }

  const bitOfSign = outBits[0];

  return [...Array(diff).fill(bitOfSign), ...outBits];
}

async function main(): Promise<void> {
  console.log(`Integer range: ${MIN_INPUT_INTEGER} - ${MAX_INPUT_INTEGER}`);

  const input1 = await userEnter('Enter 1st integer:');
  let binaryInput1 = getBinaryInteger(input1);
  const input2 = await userEnter('Enter 2nd integer:');
  let binaryInput2 = getBinaryInteger(input2);

  const commonBitLength = Math.max(binaryInput1.length, binaryInput2.length);

  console.log({ 1: binaryInput1.length, 2: binaryInput2.length, maxBitLength: commonBitLength });

  binaryInput1 = signExtension(binaryInput1, commonBitLength);
  binaryInput2 = signExtension(binaryInput2, commonBitLength);

  let binarySum = getBinarySum((binaryInput1), binaryInput2, commonBitLength);
  const overflow = binarySum.length - commonBitLength;

  if (overflow) {
    binarySum.splice(0, overflow);
  }

  let signOfSum = binarySum.shift();

  if (signOfSum) {
    binarySum = getNegativeBits([signOfSum, ...binarySum]);
  }

  const decimalSum = parseInt(binarySum.join(''), 2) * (signOfSum ? -1 : 1);

  console.log({ binarySum, decimalSum });
}

main()
  .then(() => {
    console.log('process end');
    process.exit();
  })
  .catch((err) => {
    console.log('process err', err);
    process.exit();
  });
