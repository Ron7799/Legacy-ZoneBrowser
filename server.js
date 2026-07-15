const express = require("express");
const fs = require("fs");

const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

const config = require("./config");

const app = express();

const PORT = 3000;


app.use(express.json());

app.use(session({

    secret: "secret-key-change-this",

    resave: false,

    saveUninitialized: false

}));


app.use(passport.initialize());

app.use(passport.session());



passport.serializeUser((user, done)=>{

    done(null, user);

});


passport.deserializeUser((user, done)=>{

    done(null, user);

});



passport.use(new DiscordStrategy({

    clientID: config.discordClientID,

    clientSecret: config.discordClientSecret,

    callbackURL: config.callbackURL,

    scope: ["identify"]

},


(accessToken, refreshToken, profile, done)=>{


    return done(null, profile);


}));


// מציג קבצי HTML מאותה תיקייה
app.use(express.static(__dirname));



const database = "./database.json";



// קריאת מסד נתונים

function getData(){

    return JSON.parse(
        fs.readFileSync(database, "utf8")
    );

}



// שמירת מסד נתונים

function saveData(data){

    fs.writeFileSync(
        database,
        JSON.stringify(data, null, 2)
    );

}




// יצירת אירוע

app.post("/api/events", (req,res)=>{


    console.log("📅 התקבל אירוע");



    const data = getData();



    const event = {


        id: Date.now(),


        title: req.body.title,


        date: req.body.date,


        time: req.body.time,


        location: req.body.location,


        prize: req.body.prize,


        description: req.body.description


    };



    data.events.push(event);



    saveData(data);



    console.log(event);



    res.json({

        success:true

    });


});





// שליפת אירועים

app.get("/api/events",(req,res)=>{


    const data = getData();


    res.json(data.events);


});

// מחיקת אירוע

app.delete("/api/events/:id", (req, res) => {

    const id = Number(req.params.id);

    const data = getData();


    data.events = data.events.filter(event => event.id !== id);


    saveData(data);


    console.log("🗑️ אירוע נמחק:", id);


    res.json({
        success: true
    });

});

// יצירת עדכון חדש

app.post("/api/updates",(req,res)=>{


    const {

        title,
        message

    } = req.body;



    if(!title || !message){

        return res.json({

            success:false

        });

    }



    const data = getData();



    data.updates.push({

        id: Date.now(),

        title:title,

        message:message,

        date:new Date().toLocaleDateString("he-IL")

    });



    saveData(data);



    console.log("📢 עדכון חדש:", title);



    res.json({

        success:true

    });


});




// קבלת עדכונים

app.get("/api/updates",(req,res)=>{


    const data = getData();


    res.json(data.updates);


});




// מחיקת עדכון

app.delete("/api/updates/:id",(req,res)=>{


    const id = Number(req.params.id);


    const data = getData();



    data.updates = data.updates.filter(update => update.id !== id);



    saveData(data);



    console.log("🗑️ עדכון נמחק:", id);



    res.json({

        success:true

    });


});

// התחברות עם Discord

app.get("/auth/discord",

passport.authenticate("discord"));




// חזרה מדיסקורד

app.get("/auth/discord/callback",

passport.authenticate("discord",{

    failureRedirect:"/login.html"

}),

(req,res)=>{

    res.redirect("/admin.html");

});




// בדיקת הרשאת מנהל

app.get("/api/check-admin",(req,res)=>{


    if(!req.user){

        return res.json({

            admin:false

        });

    }



    const isAdmin =
    config.admins.includes(req.user.id);



    res.json({

        admin:isAdmin,

        id:req.user.id

    });


});

app.get("/admin",(req,res)=>{


    if(!req.user){

        return res.redirect("/login.html");

    }


    const isAdmin =
    config.admins.includes(req.user.id);



    if(!isAdmin){

        return res.send("אין לך הרשאה");

    }


    res.sendFile(__dirname + "/admin.html");


});

app.listen(PORT,()=>{


    console.log(
        `🚀 האתר עובד בכתובת http://localhost:3000/${PORT}`
    );


});