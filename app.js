var express = require('express');
var session = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var https=require('https');



var urlencodedParser = bodyParser.urlencoded({ extended: false });

var app = express();
var init=true;
var pointsTmp=[];

var nomTmp, startTmp, stopTmp;


console.log("je parcours app.js")
/* On utilise les sessions */
app.use(session({secret: 'todotopsecret'}))


/* S'il n'y a pas de todolist dans la session,
on en crée une vide sous forme d'array avant la suite */
.use(function(req, res, next){
    if (typeof(req.session.todolist) == 'undefined') {
        req.session.todolist = [];
    }
  if (typeof(req.session.points) == 'undefined') {    
        req.session.points = [];
		console.log("init points")
		init=false;
    }
    if (typeof(req.session.participant) == 'undefined') {
        req.session.partricipant = "";
		console.log("init participant")
    }
    next();
})

/* On affiche  le formulaire et la liste*/
.get('/todo', function(req, res) { 
    res.render('todo.ejs', {points:pointsTmp, 
                            participant:nomTmp,
                            start:startTmp,
                            stop:stopTmp
                        });
})


/* On demande le suivi d'un parcours */
.post('/parcours/', urlencodedParser, function(req, res) {
	console.log("lancement de la methode");
    req.session.points=[];
    if (req.body.name != '') {
        console.log(req.body.name)

        req.session.participant=req.body.name;
        req.session.start=req.body.start;
        req.session.stop=req.body.stop;
		
		nomTmp=req.body.name;
        startTmp=req.body.start;
        stopTmp=req.body.stop;
		
        
        //appel au webservice
        var request = https.get(
          //  "https://l4yokjz2aj.execute-api.eu-west-3.amazonaws.com/POC_DeploiementAPI/mesures/participant/CRETEAUX?start=0h:00min:35s&stop=2h:56min:5s", function(response){
            "https://inavvg4aug.execute-api.eu-west-3.amazonaws.com/POC_Etape_API/course/participants/"+req.session.participant+"?start="+req.session.start+"&stop="+req.session.stop, function(response){
            var body="";
			let buffer=[];
			let i=0;
			var d;
			
            response.on('data', function(chunk){
				buffer.push(chunk);
				console.log("response.on en cours");
				//console.log(buffer);
				i++;
               // body+=chunk;
            });
            response.on('end', function(){
				body=buffer.join( "" );
                var jesonRecu=JSON.parse(body);
				console.log("response.end en cours");
				console.log("i vaut : "+i);
				//console.log(jesonRecu);
				//verifier que le tableau n'est pas vide avant de le parcourir


                jesonRecu.Items.forEach((element, index)=> {

/*                     console.log("index :"+index)
                    console.log("Heure :"+element.Heure.S)
                    console.log("Altitude :"+element.Altitude.N)
                    console.log("Vitesse :"+element.Vitesse.S)
                    console.log("Nom du participant :"+element.Participant.S)
                    console.log("long :"+element.Longitude.S)
                    console.log("lat :"+element.Latitude.S) */


                    var pointLB=[];
                    pointLB.push(index);
					dateTexte=element.DateHeure.S.trim();   //je commence par sup les espaces
					//je met en forme la date (bien formée, et je me fait une date visuelle 
					// bien formee ssi aaaa-mm-jjThh:mm:ss.sssZ
						  A=dateTexte.slice(0, 4);
						  M=dateTexte.slice(5,dateTexte.indexOf("-",5));
						  J=dateTexte.slice(dateTexte.indexOf("-",5)+1,dateTexte.indexOf("T"));
						  H=dateTexte.slice(dateTexte.indexOf("T")+1,dateTexte.indexOf(":"));
						  Min=dateTexte.slice(dateTexte.indexOf(":")+1,dateTexte.indexOf(":",dateTexte.indexOf(":")+1));
						  S=dateTexte.slice(dateTexte.indexOf(":",dateTexte.indexOf(":")+1)+1,-5);
						  fin=dateTexte.slice(-5);
						  if (M.length!=2) M="0".concat(M);
						  if (J.length!=2) J="0".concat(J);
						  if (H.length!=2) H="0".concat(H);
						  if (Min.length!=2) Min="0".concat(Min);
						  if (S.length!=2) S="0".concat(S);
						  //et donc dateTexte Bien formée
						  dateTexte=A.concat("-",M,"-",J,"T",H,":",Min,":",S,fin);      //".000Z"
						  //dateHeureVisuelle=jj/mm/hh - HH:mm:ss
						  dateHeureVisuelle=J.concat("/",M,"/",A.slice(2)," - ",H,":",Min,":",S);
						  
                    pointLB.push(dateHeureVisuelle);
					//je vais faire une colonne avec date heure plus visible
					
					pointLB.push(element.Altitude.S);
                    pointLB.push(element.Vitesse.S);
                    pointLB.push(element.Longitude.S); 
                    pointLB.push(element.Latitude.S); 
					pointLB.push(dateTexte);
                    req.session.points.push(pointLB);
					
					//console.log(index + "  -  "+element.DateHeure.S.replace(/\s/g,'')+"__");
                   
                });
				
				//il faut à présent trier le tableau req.session.points
				//car le webservice renvoi par ordre alpha avec date mal formée
				// par rapport au champ fdateHeure 
				// la date est bien formée, je peu donc la parser
				
				req.session.points.sort(function compareNombres(a, b) {
						return (Date.parse(a[6]) - Date.parse(b[6]));
						});
				
			   pointsTmp=req.session.points;
               res.redirect('/todo');
				
				
              console.log("fin de la requette http")  
              console.log("etat req session points : "+req.session.points);
			   console.log("participant : "+req.session.participant);
			   console.log("start : "+req.session.start);
			   console.log("stop : "+req.session.stop);

              console.log("page final reaffichee");
              console.log(req.session.participant);
			  

			  
			  
			  
			  
			  //string.slice(start, end)  renvois une chaine
			  //str.length  retourne la longueur de la chaine
			  //str.indexOf("x", n); index de x à partir de la position name
			  // str1.concat(str2, str3); 


			  

			  
            });

        
        });   
        

    }

    //res.redirect('/todo');
    //console.log("etat hors de la boucle de parcours de https :"+req.session.points);
})



/* On redirige vers la todolist si la page demandée n'est pas trouvée */
.use(function(req, res, next){
    res.redirect('/todo');
})

.listen(8080);   