import express from 'express';
import cors from 'cors';
import Joi from 'joi';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br.js';


const port = 4000;
const schemaParticipant = Joi.object({
    name: Joi.string().min(1).required(),
});

const schemaMessage = Joi.object({
    to: Joi.string().min(1).required(),
    text: Joi.string().min(1).required(),
    type: Joi.string().valid('message', 'private_message').required(),
}).with('to', 'text').with('text', 'type');

const participants = [];
const messages = [];


const app = express();
app.use(cors());
app.use(express.json());

app.get('/participants', (req,res) => {
    res.send(participants);
})

app.post('/participants', (req,res) => {
    const participant = req.body;
    const {error, value} = schemaParticipant.validate(participant);
    const now = dayjs().locale('pt-br').format('HH:mm:ss');
    if(!error){
        participants.push({...participant, lastStatus: now});
        messages.push({from: participant.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: now})
        res.sendStatus(200);
    }
    else{
        res.sendStatus(400);
    }
    
})

app.get('/messages', (req,res) => {
    const user = req.headers.user;
    const limit = req.query.limit;
    const userMessages = messages.filter(m => m.type === 'status' || m.type === 'message' || (m.type === 'private_message' && (m.from === user || m.to === user)))
    if(!!limit && limit < userMessages.length){
        const mostRecentMessages = userMessages.filter((m,i) => (i - limit) >= 0);
        res.send(mostRecentMessages);
    }
    else {
        res.send(userMessages);
    }
})

app.post('/messages', (req,res) => {
    const message = req.body;
    const from = req.headers.user;
    const {error, value} = schemaMessage.validate(message);
    const now = dayjs().locale('pt-br').format('HH:mm:ss');
    const participantsNames = participants.map(p => p.name);
    if(!error && participantsNames.includes(from)){
        messages.push({from: from , to: message.to, text: message.text, type: message.type, time: now});
        res.sendStatus(200);
    }
    else{
        res.sendStatus(400);
    }
})

app.post('/status', (req,res) => {
    res.send('ok');
})

app.listen(port, () => console.log("servidor rodando na porta " + port));