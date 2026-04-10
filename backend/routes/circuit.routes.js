const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Circuits route');
});

app.post('/', (req, res) => {
    res.send('Create a new circuit');
});

app.get('/:id', (req, res) => {
    res.send(`Get circuit with ID: ${req.params.id}`);
});

app.put('/:id', (req, res) => {
    res.send(`Update circuit with ID: ${req.params.id}`);
});

app.delete('/:id', (req, res) => {
    res.send(`Delete circuit with ID: ${req.params.id}`);
});

app.post('/:id/run', (req, res) => {
    res.send(`Run circuit with ID: ${req.params.id}`);
});

module.exports = app;