const express = require('express');
const app = express();
const port = 9876;

app.listen(port, () => {
 console.log(`Server running on http://localhost:${port}`);
});

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/averageCalculator', { useNewUrlParser: true, useUnifiedTopology: true });

const numberSchema = new mongoose.Schema({
    value: Number,
    type: String, // p, f, e, r
    timestamp: Date
});

const NumberModel = mongoose.model('Number', numberSchema);
const axios = require('axios');

// Define the API Endpoints Mapping
const apiEndpoints = {
 p: 'http://20.244.56.144/test/primes',
 f: 'http://20.244.56.144/test/fibo',
 e: 'http://20.244.56.144/test/even', 
 r: 'http://20.244.56.144/test/rand'
};

async function fetchNumber(type) {
 // Use the mapping to determine the correct API endpoint
 const endpoint = apiEndpoints[type];
 if (!endpoint) {
    throw new Error(`Invalid type: ${type}`);
 }

 const response = await axios.get(endpoint);
 return response.data;
}

app.get('/numbers/:id', async (req, res) => {
    const { id } = req.params;
    const type = id.charAt(0); // Extract the type from the ID
    const numberId = id.slice(1); // Extract the number ID
  
    try {
      const number = await fetchNumber(type);
      const newNumber = new NumberModel({ value: number, type, timestamp: new Date() });
      await newNumber.save();
  
      const numbers = await NumberModel.find({ type }).sort({ timestamp: -1 }).limit(10);
      const avg = numbers.reduce((sum, num) => sum + num.value, 0) / numbers.length;
  
      res.json({
        WindowPrevState: numbers.slice(1),
        WindowCurrState: numbers,
        numbers: numbers.map(num => num.value),
        avg: avg.toFixed(2)
      });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});
