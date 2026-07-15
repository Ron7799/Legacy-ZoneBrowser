const express = require("express");
const fs = require("fs");

const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

const config = require("./config");

const app = express();

const PORT = process.env.PORT || 3000;


// =====================
// Middleware
// =====================

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


app.use(session({

    secret: process.env.SESSION_SECRET || "secret-key",

    resave: false,

    saveUninitialized: false

}));


app.use(passport.initialize());
app.use(passport.session());



// =====================
// Passport Discord
// =====================


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

    scope: [
        "identify"
    ]

},


(accessToken, refreshToken, profile, done)=>{


    return done(null, profile);


}));



// קבצי האתר

app.use(express.static(__dirname));



// =====================
// Database
// =====================

const database = "./database.json";


function getData(){

    return JSON.parse(
        fs.readFileSync(database,"utf8")
    );

}



function saveData(data){

    fs.writeFileSync(
        database,
        JSON.stringify(data,null,2)
    );

}



// =====================
// Admin Check
// =====================


function isAdmin(req){

    if(!req.user){
        return false;
    }


    return config.admins.includes(
        req.user.id
    );

}

// =====================
// Discord Login
// =====================


app.get("/auth/discord",
passport.authenticate("discord"));



app.get("/auth/discord/callback",

passport.authenticate("discord",{

    failureRedirect:"/login.html"

}),

(req,res)=>{

    res.redirect("/admin.html");

});



// =====================
// Admin API
// =====================


app.get("/api/check-admin",(req,res)=>{


    res.json({

        admin:isAdmin(req),

        id:req.user ? req.user.id : null

    });


});




// פרטי משתמש

app.get("/api/user",(req,res)=>{


    if(!req.user){

        return res.json({

            loggedIn:false

        });

    }


    res.json({

        loggedIn:true,

        id:req.user.id,

        username:req.user.username,

        avatar:req.user.avatar

    });


});




// כניסה לפאנל מוגן

app.get("/admin",(req,res)=>{


    if(!isAdmin(req)){

        return res.redirect("/login.html");

    }


    res.sendFile(
        __dirname + "/admin.html"
    );


});




// Logout

app.get("/logout",(req,res)=>{


    req.logout(()=>{


        req.session.destroy(()=>{


            res.redirect("/login.html");


        });


    });


});



// =====================
// EVENTS
// =====================



app.post("/api/events",(req,res)=>{


    if(!isAdmin(req)){

        return res.status(403).json({

            success:false,

            message:"אין הרשאה"

        });

    }



    const data = getData();



    const event = {


        id:Date.now(),


        title:req.body.title,


        date:req.body.date,


        time:req.body.time,


        location:req.body.location,


        prize:req.body.prize,


        description:req.body.description


    };



    data.events.push(event);



    saveData(data);



    res.json({

        success:true

    });


});





app.get("/api/events",(req,res)=>{


    const data = getData();


    res.json(data.events);


});




app.delete("/api/events/:id",(req,res)=>{


    if(!isAdmin(req)){

        return res.status(403).json({

            success:false

        });

    }



    const id = Number(req.params.id);



    const data = getData();



    data.events =
    data.events.filter(
        event=>event.id !== id
    );



    saveData(data);



    res.json({

        success:true

    });


});

// =====================
// UPDATES
// =====================


app.post("/api/updates",(req,res)=>{


    if(!isAdmin(req)){

        return res.status(403).json({

            success:false,

            message:"אין הרשאה"

        });

    }



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

        id:Date.now(),

        title:title,

        message:message,

        date:new Date()
        .toLocaleDateString("he-IL")

    });



    saveData(data);



    res.json({

        success:true

    });


});





app.get("/api/updates",(req,res)=>{


    const data = getData();


    res.json(data.updates);


});





app.delete("/api/updates/:id",(req,res)=>{


    if(!isAdmin(req)){

        return res.status(403).json({

            success:false

        });

    }



    const id = Number(req.params.id);



    const data = getData();



    data.updates =
    data.updates.filter(
        update=>update.id !== id
    );



    saveData(data);



    res.json({

        success:true

    });


});



// =====================
// START SERVER
// =====================


app.listen(PORT,()=>{


    console.log(
        `🚀 Server running on port ${PORT}`
    );


});