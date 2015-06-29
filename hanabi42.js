Router.onBeforeAction(function () {
  // all properties available in the route function
  // are also available here such as this.params

  if (!Meteor.userId()) {
    // if the user is not logged in, render the Login template
    this.render('Login');
  } else {
    // otherwise don't hold up the rest of hooks or our route/action function
    // from running
    this.next();
  }
});

Router.route('/', function () {
  this.layout('hanabiLayout');
  this.render('uebersicht');
});

Router.route('/uebersicht', function () {
  this.layout('hanabiLayout');
  this.render('uebersicht');
},{
  name: 'uebersicht'
});
Router.route('/spiel/:_id', function () {
  var einSpiel = spiel.findOne({_id: this.params._id});
  this.layout('hanabiLayout');

  this.render('spiel', {data: einSpiel});
},{
  name: 'spiel.show'
});

spiel = new Mongo.Collection('spiel');
mitSpieler = new Mongo.Collection('mitSpieler');
karte = new Mongo.Collection('karte');
kartenInfo = new Mongo.Collection('kartenInfo');

const stapelId = "STAPELID";
const ablageId = "ABLAGEID";
const auslageId = "AUSLAGEID";

var kartenVorrat = new Array
                      ({zahl:1,farbe:"blau"},{zahl:1,farbe:"gelb"},{zahl:1,farbe:"gruen"},{zahl:1,farbe:"rot"},{zahl:1,farbe:"weiss"}
                      ,{zahl:1,farbe:"blau"},{zahl:1,farbe:"gelb"},{zahl:1,farbe:"gruen"},{zahl:1,farbe:"rot"},{zahl:1,farbe:"weiss"}
                      ,{zahl:1,farbe:"blau"},{zahl:1,farbe:"gelb"},{zahl:1,farbe:"gruen"},{zahl:1,farbe:"rot"},{zahl:1,farbe:"weiss"}
                      ,{zahl:2,farbe:"blau"},{zahl:2,farbe:"gelb"},{zahl:2,farbe:"gruen"},{zahl:2,farbe:"rot"},{zahl:2,farbe:"weiss"}
                      ,{zahl:2,farbe:"blau"},{zahl:2,farbe:"gelb"},{zahl:2,farbe:"gruen"},{zahl:2,farbe:"rot"},{zahl:2,farbe:"weiss"}
                      ,{zahl:3,farbe:"blau"},{zahl:3,farbe:"gelb"},{zahl:3,farbe:"gruen"},{zahl:3,farbe:"rot"},{zahl:3,farbe:"weiss"}
                      ,{zahl:3,farbe:"blau"},{zahl:3,farbe:"gelb"},{zahl:3,farbe:"gruen"},{zahl:3,farbe:"rot"},{zahl:3,farbe:"weiss"}
                      ,{zahl:4,farbe:"blau"},{zahl:4,farbe:"gelb"},{zahl:4,farbe:"gruen"},{zahl:4,farbe:"rot"},{zahl:4,farbe:"weiss"}
                      ,{zahl:4,farbe:"blau"},{zahl:4,farbe:"gelb"},{zahl:4,farbe:"gruen"},{zahl:4,farbe:"rot"},{zahl:4,farbe:"weiss"}
                      ,{zahl:5,farbe:"blau"},{zahl:5,farbe:"gelb"},{zahl:5,farbe:"gruen"},{zahl:5,farbe:"rot"},{zahl:5,farbe:"weiss"}
                      );

if (Meteor.isClient) {

  function farbAttr(farbe){
      if(farbe=="blau")
        return "blue accent-4 black-text";
      if(farbe=="gelb")
        return "yellow accent-2 black-text";
      if(farbe=="gruen")
        return "green accent-4 black-text";
      if(farbe=="rot")
        return "red accent-2 black-text";
      if(farbe=="weiss")
        return "blue-grey lighten-5 black-text";
  };

  function gameOver(spielId){

    if(karte.find({spielId:spielId,ortId:auslageId,zahl:5}).count() == 5){
      spiel.update(spielId,{$set:{status:"gewonnen"}});
    }else{
      spiel.update(spielId,{$set:{status:"verloren"}});
    }

  };

  function nachZiehen(spielId){
    if(karte.find({spielId:spielId,ortId:stapelId}).count()==0)
      return;
    var nachZiehKarteId = karte.findOne({spielId:spielId,ortId:stapelId},{sort: {position:1}})._id;
    karte.update(nachZiehKarteId,{$set:{ortId:spiel.findOne(spielId).aktivId}});
  }


  function nextSpieler(spielId){
    var nextPosition = mitSpieler.findOne({spielerId:spiel.findOne(spielId).aktivId}).position + 1;
    if(karte.find({spielId:spielId,ortId:stapelId}).count()==0){
      spiel.update(spielId,{$inc:{letzteRunde:1}});
    }
    if(spiel.findOne(spielId).letzteRunde > mitSpieler.find({spielId:spielId}).count()){
      gameOver(spielId);
      return;
    };
    if(nextPosition==mitSpieler.find({spielId:spielId}).count())
      nextPosition = 0;
    spiel.update(spielId,{$set:{aktivId:mitSpieler.findOne({spielId:spielId,position:nextPosition}).spielerId}});
  };


  Template.uebersicht.helpers({
    spiel: function(){
      return spiel.find();
    }
  });

  Template.uebersicht.events({
    "click #neuesSpiel": function(){
       var spielId = spiel.insert({status:"neu", nummer:spiel.find().count()+1, aktivId:"", verbleibendeTipps:8, gewitter:0, letzteRunde:0});

       for(i=0;i<50;i++){
         j = Math.floor(Math.random()*(50-i))+i;
         var zahl = kartenVorrat[j].zahl;
         var farbe = kartenVorrat[j].farbe;
         kartenVorrat[j].zahl = kartenVorrat[i].zahl;
         kartenVorrat[j].farbe = kartenVorrat[i].farbe;
         kartenVorrat[i].zahl = zahl;
         kartenVorrat[i].farbe = farbe;
       }

       for(i=0;i<50;i++){
           karte.insert({spielId:spielId, position:i, zahl:kartenVorrat[i].zahl, farbe:kartenVorrat[i].farbe, ortId:stapelId,
                         farbAttr:farbAttr(kartenVorrat[i].farbe)});
       }
    }
  });

  Template.spiel.helpers({
    isStarted: function(){
      Session.set("spielId",this._id);
      return (this.status != "neu");
    },
    gameOver: function(){

      Session.set("spielId",this._id);
      if(this.status=="verloren")
        return true;
      if(this.status=="gewonnen")
        return true;
      return false;

    },
    mitSpieler: function(){
      Session.set("spielId",this._id);
      return mitSpieler.find({spielId:this._id});
    },
  });

  Template.spiel.events({
    "click #starten": function(){
      if(mitSpieler.find({spielId:this._id}).count() > 1){
        spiel.update(this._id,{$set:{status:"gestartet", aktivId:mitSpieler.findOne({spielId:this._id}).spielerId }});

        var kartenLimit = 5;
        if(mitSpieler.find({spielId:this._id}).count() > 3)
          kartenLimit = 4;

        var kartenPosition = 0;
        var spielerPosition = 0;
        mitSpieler.find({spielId:this._id}).forEach(function(spieler){
          mitSpieler.update(spieler._id,{$set:{position:spielerPosition}});
          spielerPosition++;
          for(i=0;i<kartenLimit;i++){
            karte.update(karte.findOne({spielId:spieler.spielId, position:kartenPosition})._id,{$set:{ortId:spieler.spielerId}});
            kartenPosition++;
          }
        });


      }
    },
    "click #mitspielen": function(){
      if(mitSpieler.findOne({spielId:this._id,spielerId:Meteor.userId()}))
        return;
      if(mitSpieler.find({spielId:this._id}).count() > 4)
        return;
      mitSpieler.insert({spielId:this._id,spielerId:Meteor.userId(),name:Meteor.user().emails[0].address, position:0});
    }
  });

  Template.spieler.helpers({
    karte: function(){
      return karte.find({spielId:this.spielId, ortId:this.spielerId},{sort: {position:1}});
    },
    isMitSpieler: function(){
      if( this.ortId != Meteor.userId() )
        return true;
    },
    isAktiv: function(){
      if( Meteor.userId() == spiel.findOne(this.spielId).aktivId )
        return true;
    },

    kartenInfo: function(){
      return kartenInfo.find({karteId:this._id});
    }
  });

  Template.spieler.events({
    "click #farbTipp": function(){
      var farbe = this.farbe;
      if(spiel.findOne(this.spielId).verbleibendeTipps>0){
        karte.find({spielId:this.spielId,ortId:this.ortId,farbe:farbe}).forEach(function(handKarte){
          if(kartenInfo.find({karteId:handKarte._id,info:farbe}).count()==0)
            kartenInfo.insert({karteId:handKarte._id,info:farbe});
        });
        spiel.update(this.spielId, {$inc:{verbleibendeTipps:-1}});
        nextSpieler(this.spielId);
      }
    },
    "click #zahlTipp": function(){
      var zahl = this.zahl;
      if(spiel.findOne(this.spielId).verbleibendeTipps>0){
        karte.find({spielId:this.spielId,ortId:this.ortId,zahl:zahl}).forEach(function(handKarte){
          if(kartenInfo.find({karteId:handKarte._id,info:zahl}).count()==0)
            kartenInfo.insert({karteId:handKarte._id,info:zahl});
        });

        spiel.update(this.spielId, {$inc:{verbleibendeTipps:-1}});
        nextSpieler(this.spielId);
      }
    },
    "click #spielen": function(){
      var farbe = this.farbe;
      var zahl  = this.zahl;

      var ok=true;
      if(zahl>1)
        if(karte.find({spielId:this.spielId,ortId:auslageId,farbe:farbe,zahl: zahl-1}).count()!=1)
          ok=false;
      if(karte.find({spielId:this.spielId,ortId:auslageId,farbe:farbe,zahl: zahl}).count()>0)
        ok=false;

      if(ok){
        karte.update(this._id,{$set:{ortId:auslageId}});
        if(zahl==5)
          if(spiel.findOne(this.spielId).verbleibendeTipps<8)
            spiel.update(this.spielId,{$inc:{verbleibendeTipps:1}});
      }else {
        karte.update(this._id,{$set:{ortId:ablageId}});
        spiel.update(this.spielId,{$inc:{gewitter:1}});
        if(spiel.findOne(this.spielId).gewitter>2)
          gameOver(this.spielId);
      }
      nachZiehen(this.spielId);
      nextSpieler(this.spielId);
    },
    "click #abwerfen": function() {
      karte.update(this._id,{$set:{ortId:ablageId}});
      if(spiel.findOne(this.spielId).verbleibendeTipps<8)
        spiel.update(this.spielId,{$inc:{verbleibendeTipps:1}});
      nachZiehen(this.spielId);
      nextSpieler(this.spielId);
    }

  });

  Template.tisch.helpers({
    stapelHoehe: function(){
      return karte.find({spielId:this._id, ortId:stapelId}).count()
    }
  });

  var lastFarbe = "";
  var lastFarbe2 = "";
  Template.tischKarten.helpers({
    karte: function(){
      var spielId = Session.get("spielId");
      return karte.find({spielId:spielId,ortId:this.ortId},{sort: {farbe: 1, zahl:1}});
    },
    newFarbe: function(){
      if(this.farbe==lastFarbe)
        return false;
      lastFarbe = this.farbe;
      return true;
    },
    newFarbe2: function(){
      if(this.farbe==lastFarbe2)
        return false;
      lastFarbe2 = this.farbe;
      return true;
    }

  });

}
