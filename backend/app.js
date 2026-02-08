const express = require("express");
const app = express();
const path = require("path");
const mysql=require("mysql2");
const bcrypt = require("bcrypt");
const session=require("express-session");
const { error } = require("console");

app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "../frontend/logo")));
app.use(express.json());

app.use(session({
    secret: 'your-secret-key',           
  resave: false,                        
  saveUninitialized: false,            
  cookie: { 
    secure: false,                    
    maxAge: 1000 * 60 * 60 * 24      
  }
}));

let PORT = 3000;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Neev2007',
    database: 'anime'
});

connection.connect();

app.post("/register", async(req, res) => {

    let {Username,Gmail,password}=req.body;
    
    if(!Username||!Gmail||!password){
        return res.json({
            message:"All fields are required"
        })
    }


     const hashedPassword = await bcrypt.hash(password, 10);
      
        const query = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

        const result=connection.query(query,[Username,Gmail,hashedPassword],(error,result)=>{

          if(error){
            return res.json({
                message:error
            });
          }

          if(result){

            
            return res.json({
                message:"suuceful register"
            });
          }

        });


   
});

app.get("/home", (req, res) => {

    if(req.session.userid){
        
  res.sendFile(path.join(__dirname , '../frontend/home_page.html'));
    }else{
        return res.json({
            message:"loggin first"
        });
    }
  
});

app.post("/login",async(req,res)=>{

let {Gmail,password}=req.body;
    
    if(!Gmail||!password){
        return res.json({
            message:"All fields are required"
        })
    }

    let response=connection.query("select * from users where email =?",[Gmail],async(error,result)=>{

    if(error){
        console.log(error);
      res.json({
        message:"error from login"
      });
    }      
    



    if(result && result.length > 0){
       let pass= await  bcrypt.compare(password,result[0].password);

        if(pass){

            req.session.userid=result[0].id;
            req.session.name=result[0].username;
            req.session.email=result[0].email;

            return res.json({  
                    message: "Login successful",
                    redirect: "/home"
                });   


        }else{
            return res.json({
            message:"wrong password"
        });
        }   

    }else{
        return response.json({
            message:"user doest exist"
        });
    }

    });

});


app.get("/top_airing",async(req,res)=>{

try{

const response = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
        const data = await response.json();
        
        res.json(data);

}catch(error){
 res.json({message: "Error fetching anime"});
}
});


app.get("/get_anime",async(req,res)=>{
  

try {
        const response = await fetch(
'https://api.jikan.moe/v4/anime?limit=25&page=1'
        );
        
        const data = await response.json();
      
        res.json(data);
    } catch(error) {
        res.status(500).json({message: "Error fetching anime"});
    }



});

app.get("/get_topani", async(req, res) => {
    try {
        const response = await fetch(
            'https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=10'
        );
        
        const data = await response.json();
        res.json(data);
    } catch(error) {
        res.status(500).json({message: "Error fetching anime"});
    }
});
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true, message: "Logged out" });  
    });
}); 
app.post("/bookmark", (req, res) => {
  const { mal_id } = req.body;
  console.log(mal_id);
  const userId = req.session.userid;
  
  connection.query(
    "INSERT INTO bookmarks (user_id, mal_id) VALUES (?, ?)",
    [userId, mal_id],
    (err, result) => {
      if (err) return res.status(400).json({ error: "Already bookmarked" });
      res.json({ success: true });
    }
  );
});


app.get("/bookmarks", (req, res) => {
  const userId = req.session.userid;
  
  connection.query(
    "SELECT mal_id FROM bookmarks WHERE user_id = ?",
    [userId],
    (err, results) => {
      res.json(results);
    }
  );
});


app.get("/profile",(req,res)=>{


     if(!req.session.userid) {
        return res.status(401).json({ message: "Not authenticated" });
    }

const id=req.session.userid;

connection.query("select username,email,created_at from users where id=?",[id],(error,result)=>{

    if(error){
        res.json("error opening in profile");
    }

   if(result.length > 0) {
    res.json({
        username: result[0].username,
        email: result[0].email,
        createdat: result[0].created_at
    });
}else{
        res.json({
            message:"profile dosent exist"
        });
    }
});

});


app.delete("/bookmarks/:mal_id", (req, res) => {
    const userId = req.session.userid;
    const malId = req.params.mal_id;

    if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    connection.query(
        "DELETE FROM bookmarks WHERE user_id = ? AND mal_id = ?",
        [userId, malId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Failed to delete" });
            }
            res.json({ success: true, message: "Bookmark removed" });
        }
    );
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/register_page.html"));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
