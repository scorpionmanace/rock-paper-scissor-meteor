Players = new Mongo.Collection("players");
Games = new Mongo.Collection("games");
if (Meteor.isClient) {
    console.log("Hello Client!");

    //    Intially calling the initialize method from the server , just to create the initial player documents in case not created already. This way the app is able to limit the game to two player only and having a check not more than two players can get created

    Meteor.call("initializePlayers", function (err, data) {
        if (err) {
            console.log(err);
        }
    });

    Template.body.helpers({

        //getting the active player counts and setting the count to the session persistance for further usage
        activePlayerCount: function () {
            var count = Session.get("ActivePlayerCount");
            if (count >= 0) {
                return count;
            } else {
                Meteor.call("getActivePlayerCount", function (err, data) {
                    if (!err) {
                        Session.set("ActivePlayerCount", data)
                    }
                });
            }
        }
    });
    //creating helper methods for the playWrapper template for two-way data binding
    Template.playWrapper.helpers({
        isGameFull: function () {
            if (Session.get("ActivePlayerCount") == 2)
                return true;
            return false;
        },
        //        Checking if current player if playing game
        isCurrentPlayerOn: function () {
            if (Session.get("currentPlayer") == undefined || !Session.get("currentPlayer")) {
                return false;
            }
            return true;
        },
        gameStartOrLeave : function(){
            if(!Session.get("gameState"))
                return "Join";
            return Session.get("gameState");
        }
    });
    //    Event binding for the template action items in the playWrapper
    Template.playWrapper.events({
//        Actions taking place when Join button is clicked
        "click .Join": function (callback) {
            var playersCount = Session.get("ActivePlayerCount");
            var ActivePlayers;
            var currentPlayer;

            //            Making a server call to get active player value i.e. player 1 or player 2
            Meteor.call("getActivePlayerValue", function (err, data) {
                if (!err) {
                    ActivePlayers = data;
                    console.log(ActivePlayers);

                    //                    Checking if there are any active players present as of now
                    if (ActivePlayers.length == 0) {
                        currentPlayer = 1;
                        Session.set("currentPlayerValue", currentPlayer);
                    } else
                    if (ActivePlayers.length == 1) {
                        if (ActivePlayers[0] == 1) {
                            currentPlayer = 2
                        } else {
                            currentPlayer = 1;
                        }
                        Session.set("currentPlayerValue", currentPlayer);

                    }

                    Session.set("gameState", "Leave");
                    //                    After the checks are made to set player 1 or player 2, session is created for that particular player
                    createPlayerSession(currentPlayer);
                }
            });


        },
        "click .Leave": function () {
            removePlayerSession();
        }
    });
    
    Template.body.helpers({
        allowPlayground : function(){
            if(Session.get("currentPlayer") !=undefined){
                return true;
            }
            return false;
        }
    });
    
    Template.player1scoreboard.helpers({
        scores : function(){
            return Players.find({value:1},{score:1, _id:0});
        },
        weapons : function(){
                        return Games.find({_id:Session.get("currentGame")},{player2:1});
        }
    });
    
    Template.playItems.events({
        "click .rock":function(event){
            event.preventDefault();
            var weapon = event.target.attributes.value;
            updateGame(weapon);
        },
        "click .paper":function(event){
            event.preventDefault();
            var weapon = event.target.attributes.value;
            updateGame(weapon);
        },
        "click .scissor":function(event){
            event.preventDefault();
            var weapon = event.target.attributes.value;
            updateGame(weapon);
        }
    });
    
    Template.player2scoreboard.helpers({
         scores : function(){
            return Players.find({value:2},{score:1, _id:0});
        },
        weapons : function(){
            return Games.find({_id:Session.get("currentGame")},{player2:1});
        }
    });
    
    Template.tableBoard.helpers({
        winner : function(){
            return Games.find({_id:Session.get("currentGame")},{winner:1});
        }
    });

    //Function contacts the server to update the user status and score whenever happens
    function updateUser(currentPlayer, status, score) {
        Meteor.call("updatePlayer", currentPlayer, status, score, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                var _increment = status ? 1 : -1;

                Session.set("ActivePlayerCount", Session.get("ActivePlayerCount") + _increment);
                if(Session.get("ActivePlayercount") == 2)
                    startGame();
            }
            
        });
    }
    //function used to created the player session (for current player)
    function createPlayerSession(currentPlayer) {
        Meteor.call("getCurrentPlayer", currentPlayer, function (err, response) {
            if (!err) {
                Session.set("currentPlayer", response[0]._id);
                updateUser(Session.get("currentPlayer"), true, 0);
            } else {
                console.log(err);
            }
        });

    }
//method is called when the user wants to leave the game than, he is removed from the session
    function removePlayerSession() {
        Session.set("gameState","Join")
        updateUser(Session.get("currentPlayer"), false, 0);
        delete Session.keys["currentPlayer"];
    }

}

//function called when the game needs to be started
function startGame(){
    Meteor.call("createGame",function(err,data){
        if(err){
            console.log(err);
        }
        else{
            Session.set("currentGame",data);
        }
    });
}


function updateGame(weapon){
    Session.set("currentWeapon",weapon);
    var currentPlayer = Session.get("ActivePlayerValue");
    var currentGame = Session.get("currentGame");
 Meteor.call("updateGame",currentPlayer,currentGame,weapon,function(err,data){
     if(err){
         console.log(err);
     }
     else{
         Meteor.timeout(function(){
             Meteor.call("calculateWinner",currentGame);
         },3000);
     }
 });
}