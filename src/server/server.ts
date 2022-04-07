import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server, Socket } from "socket.io";
import type {Player } from "../shared/models/players.model.js";
import type { Quiz } from "../shared/models/quizzes.model.js";
import type { Questions } from "../shared/models/questions.model.js";
import { addName, addPlayer, answerQuestion, game, getPlayers, getQuestion, removePlayer, selectQuiz } from "./data/data.js";
import { QuizzModel } from "./schemas/quizzes.schema.js";
import { QuestionsModel } from "./schemas/questions.schemas.js";
import { PlayerModel } from "./schemas/players.schema.js"
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

export let io = new Server(server, {
	cors: { origin: ["http://localhost:4200"] },
  });
  
app.use(cors());
app.use(express.static("public"));

mongoose
	.connect(`${process.env.MONGO_URI}`)
	
	.then(() => {
		console.log("Connected to DB Successfully");
	})
	.catch((err) => console.log("Failed to Connect to DB", err));

//**********************************************************************

const __dirname = path.resolve();
const clientPath = path.join(__dirname, '/dist/client');
app.use(express.static(clientPath));

app.get("*", function (req, res) {
	const filePath = path.join(__dirname, '/dist/client/index.html');
	console.log(filePath);
	res.sendFile(filePath);
  });

//**********************************************************************
  
const players: Player[] = [];
const Quizzes: Quiz[] = [];
const question: Questions[] = [];

//Connect Socket.io and Add players
io.on("connection", (socket) => {
	socket.on("disconnect", () => {
		removePlayer(socket.id);
	});
	const player = addPlayer({ socketId: socket.id });
	console.log(game);
	if (player.host) {
		socket.emit("route", "quizzes");
	} else {
		socket.emit("route", "lobby");
	}

	//Get Quizzes
	socket.on("get quizzes", () => {
		QuizzModel.find().then((data) => {
			socket.emit("Send quizzes", data);
		});
	});
   
 	//Select Quiz
 	socket.on('select quiz', (quizz:Quiz)=>{
		QuestionsModel.find({quizId:quizz.quizId}).then((questions)=>{
			selectQuiz(questions)
			console.log(JSON.stringify(game,null,4));
			socket.emit("route", "lobby");      
		})
 	})

	//Add Name
	socket.on("add name", (name) => {
   		name = addName(name, socket.id)
		console.log(game);
 		io.emit("player added name", game.players);
	})
 
 	//Host Add name
  	socket.on("add name",(name)=>{
	  if(player.host){
		addName(name, socket.id)
		//console.log(game);
		socket.emit("route", "lobby");
    	io.emit("player added name", game.players);  
		}
  	})

	// Take all players to Quiz
	socket.on('go-to-quiz', ()=>{
		io.emit('route','question-page')
	})

	//Request Question
	socket.on("request-question", ()=>{
		const question = getQuestion()
		socket.emit("data-question", question)
	})

	//check for the answer
	socket.on("answer-question",(answer)=>{
   		if(answer){
			const allAnswer = answerQuestion( socket.id, answer)
			if(allAnswer){
				io.emit('route','leader-board')
			}
		}
	})

	//get players with points
 	socket.on("request-gamePlayers", ()=>{
		const allPlayers = getPlayers()
		socket.emit("allPlayer-data", allPlayers)
	 	console.log(allPlayers)
	})

	// Go to next question 
	socket.on('go-to-next-question', ()=>{  
		io.emit('route','question-page')
	})

}); //This is the end os socket connection


server.listen(PORT, () => {
	console.log("listening on http://localhost:" + PORT);
});
// })