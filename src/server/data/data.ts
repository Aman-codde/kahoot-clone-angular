import type { Game } from "../../shared/models/game.model.js";
import type { IPlayer } from "../../shared/models/players.model.js";

export const  defaultGame = {
    phaseIndex: 0,
    phases: ['select quiz', 'lobby', 'question', 'leader board'],
    players: [],
    quiz: null
}

export const game: Game = {
    phaseIndex: 0,
    phases: ['select quiz', 'lobby', 'question', 'leader board'],
    players: [],
    quiz: null
}

export function addPlayer(player:IPlayer){
   // console.log(game.players);
    game.players.push(player)
    if(!findHost()){
        player.host=true;
    }
    return player;
}

export function findHost(){
   return game.players.find(player=>player.host)
}

export function removePlayer(socketId:string){
   const player = findBySocket(socketId);
   game.players=game.players.filter(p=>p.socketId!==player?.socketId) 
   console.log(game);
}

function findBySocket(socketId:string) {
    return game.players.find(player => player.socketId === socketId)
}

export function selectQuiz(quiz:any) {
    game.quiz = quiz;
    //console.log(game.quiz)
}

export function addName(name:string, socketId:string) {
    const player= findBySocket(socketId);
    if(player){
        player.name = name;
    }
    return player;
}

export function getQuestion() {
   return game.quiz?.find(question => !question.completed)
}

function findCorrect() {
    return getQuestion()?.answers.find(answer => answer.correct)
}

export function hasEveryoneAnswered() {
    return game.players.every(player => player.answer)
}

export function answerQuestion(socketId:string, answer:string) {
    const user =findBySocket(socketId)
    if(user){
       user.answer=answer
     if (hasEveryoneAnswered()) {
        game.players.forEach(player => {
            const correct = player.answer === findCorrect()?.text;
            if (!player.points) {
                player.points = 0;
            }
            if (correct) {
                player.points += 1;
            }
            player.answer = null;
        });
        const question = getQuestion();
        if(question){question.completed=true}
       return true
     }
    }
}

 export function getPlayers(){
    return game.players
}

// function getPhase(){
//    return game.phases[game.phaseIndex];
// }
// function goToNextPhase() {
//     game.phaseIndex++;
//     return getPhase();
// }