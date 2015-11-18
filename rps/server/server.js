//creating the mongo collection instance for the player collection in MongoDB
Players = new Mongo.Collection("players");
Games = new Mongo.Collection("games");

//Meteor cheching is particular is the server or nor
if (Meteor.isServer) {
    console.log("Hello Server");
}

//Node and Server Methods for services with MongoDB and persistance, thus avoiding the exposure of the api
Meteor.methods({

    //    Method created the reset the documents and remove the existing instances from the database
    resetPlayers: function () {
        Players.remove({});
    },

    //    intially creating the two players in the database (so as to have a restriction of only two players in a game)
    initializePlayers: function () {
        console.log("Insertion in process");
        var players = Players.find({}).fetch();

        if (players.length == 0) {
            Meteor.call("insertPlayer", 1, false);
            Meteor.call("insertPlayer", 2, false);
            console.log("2 inactive players inserted....");
        }
    },

    //Get the values of those players in returns the array who are currently in  active state.
    getActivePlayerValue: function () {
        var active = [];
        var players = Players.find({
            active: {
                $ne: false
            }
        });
        players.forEach(function (player) {
            active.push(player.value);
        });
        return active;
    },
    //Extracts the total active players from the MongoDB
    getActivePlayerCount: function () {
        console.log("Get Active User Count Call Recieved");
        var count = Players.find({
            active: {
                $ne: false
            }
        }).count();
        console.log(count);
        return count;
    },
    //Used to get the non active players 
    //#todo: not being used anywhere as of now
    getNonActivePlayers: function () {
        console.log("Get inactive user count call recieved")
        var players = Players.find({
            active: false
        });
        return players.count();
    },
    //method gives the total count of the players present in the mongodb persistance
    getTotalCount: function () {
        console.log("Get Total Count of Players Present");
        return Players.find({}).count();
    },

    //    Method created when to insert any player in the mongodb 

    insertPlayer: function (playerValue, active_state = true) {
        if (playerValue == undefined) {
            throw new Meteor.error("Player Value not Provided");
        }
        if (Meteor.call("getTotalCount") >= 2) {
            throw new Meteor.error("Player cannot exceed limit 2");
        }
        var player = {
            value: playerValue,
            active: active_state,
            score: 0,
            updatedAt: new Date()
        };

        Players.insert(player);

    },

    //Updating the player information in MongoDB as provided by the client. This update takes place wheneven there is a state of the player update of the score of the player update is taking place.
    updatePlayer: function (id, active_state = true, gameScore = 0) {
        if (id == undefined || !id) {
            throw new Meteor.error("Player id not provided");
        }
        console.log("Player id:" + id + "Update Happening!");
        Players.update({
            _id: id
        }, {
            $set: {
                active: active_state,
                score: gameScore
            },
        }, {
            multi: false
        });
    },

    //Extracting the current active player for the client
    getCurrentPlayer: function (playerValue) {
        if (playerValue == undefined || !playerValue) {
            throw new Meteor.error("Player Value not provided...");
        }
        console.log("Current Player Information for Player " + playerValue);
        return Players.find({
            value: playerValue
        }, {
            _id: 1
        }).fetch();
    },
//    Creating initial Game in the app that can be modified later based on the choices made by the player(s)

    createGame: function (weapon1 = "", weapon2 = "", winner = "") {
        var game = {
            player1: "",
            player2: "",
            winner: "",
            createdAt: new Data()
        }
        return games.insert(game);
    },
    updateGame: function (player, gameId, weapon="") {
        if (player == undefined || !player) {
            throw new Meteor.error("Player value not provided....");
        }
        if (gameId == undefined || !gameId) {
            throw new Meteor.error("GameID Not Provided....");
        }
        if (player == 1) {
            games.update({
                _id: gameId
            }, {
                $set: {
                    player1: weapon
                }
            });
        } else if (player == 2) {
            games.update({
                _id: gameId
            }, {
                $set: {
                    player2: weapon
                }
            });
        }
    },
    
//    Function to calculate winner based on the choices made form the the particular user
    calculateWinner: function (gameId) {
        var game = games.findOne({
            _id: gameId
        }).fetch();
        var player1_weapon = game[0].player1;
        var player2_weapon = game[0].player2;
        var winner;
        if ((player1_weapon == "rock" && player2_weapon == "rock") || (player1_weapon == "paper" && player2_weapon == "paper") || (player1_weapon == "scissor" && player2_weapon == "scissor"))
            winner = "neutral";
        if (player1_weapon == "rock" && player2_weapon == "paper")
            winner = "player2";
        if (player1_weapon == "rock" && player2_weapon == "scissor")
            winner = "player1";
        if (player1_weapon == "paper" && player2_weapon == "rock")
            winner = "player1";
        if (player1_weapon == "paper" && player2_weapon == "scissor")
            winnder = "player2";
        if (player1_weapon == "scissor" && player2_weapon == "rock")
            winner = "player2";
        if (player1_weapon == "scissor" && player2_weapon == "paper")
            winner = "player1";

        Games.update({
            _id: gameId
        }, {
            winner: winner
        });
        if (winner == "player1")
            Players.update({
                value: 1
            }, {
                $inc: {
                    score: 1
                }
            });
        else
        if (winner == "player2")
            Players.update({
                value: 2
            }, {
                $inc: {
                    score: 1
                }
            });

    }


});