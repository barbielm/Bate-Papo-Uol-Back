import express from 'express';
import cors from 'cors';
import Joi from 'joi';



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
    const now = new Date();
    const participantsNames = participants.map(p => p.name);
    if(!error && !participantsNames.includes(participant.name)){
        participants.push({...participant, lastStatus: now.toLocaleTimeString()});
        messages.push({from: participant.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: now.toLocaleTimeString()})
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
    const now = new Date();
    const participantsNames = participants.map(p => p.name);
    if(!error && participantsNames.includes(from)){
        messages.push({from: from , to: message.to, text: message.text, type: message.type, time: now.toLocaleTimeString()});
        res.sendStatus(200);
    }
    else{
        res.sendStatus(400);
    }
})

app.post('/status', (req,res) => {
    const user = req.headers.user;
    const participantsNames = participants.map(p => p.name);
    if(participantsNames.includes(user)){
        for(let i = 0; i < participants.length; i++){
            if(participants[i].name === user){
                const now = new Date();
                participants[i].lastStatus = now.toLocaleTimeString();
            }
        }
        res.sendStatus(200);
    }
    else {
        res.sendStatus(400);
    }
})

function removeParticipants(){
    if(participants.length === 0){
        return
    }
    const now = new Date();
    const time = now.toLocaleTimeString();
    for(let i = 0; i < participants.length; i++){
        let p = participants[i];
        let lastSeen = parseInt(p.lastStatus[p.lastStatus.length - 2] + p.lastStatus[p.lastStatus.length - 1]);
        lastSeen += parseInt(p.lastStatus[p.lastStatus.length - 5] + p.lastStatus[p.lastStatus.length - 4])*60;
        lastSeen += parseInt(p.lastStatus[p.lastStatus.length - 8] + p.lastStatus[p.lastStatus.length - 7])*3600;
        let seconds = parseInt(time[time.length - 2] + time[time.length - 1]);
        seconds += parseInt(time[time.length - 5] + time[time.length - 4])*60;
        seconds += parseInt(time[time.length - 8] + time[time.length - 7])*3600;
        if(seconds - lastSeen > 10){
            participants.splice(i,1);
            messages.push({from: p.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: time});
        }
        else if(seconds - lastSeen < 0 && (24*60*60 + seconds - lastSeen) > 10){
            participants.splice(i,1);
            messages.push({from: p.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: time});
        }
        
    }
}
setInterval(removeParticipants, 15000);

app.listen(port, () => console.log("servidor rodando na porta " + port));