# PlantUML Icon-Font Sprites

## Getting Started

The common.puml is required for the rest to work. 
	
	!include ../common.puml
	or via url 
	!includeurl https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/common.puml

Import the sprites that you want

	!include ../devicons/mysql.puml
	!include ../font-awesome/database.puml

	or via url

	!includeurl https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/devicons/mysql.puml
	!includeurl https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/font-awesome/database.puml

To use the sprites add one of the macros

	 DEV_MYSQL(db)

The macros are prefixed with the set and the name of the icon

	<prefix>_<name>(alias)
	<prefix>_<name>(alias,label)
	<prefix>_<name>(alias,label,shape)
	<prefix>_<name>(alias,label,shape,color)
	
Using the icon from devicons for mysql
	
	DEV_MYSQL(db1)
	DEV_MYSQL(db2,label of db2)
	DEV_MYSQL(db3,label of db3,database)
	DEV_MYSQL(db4,label of db4,database,red) #DeepSkyBlue

![overload-example](examples/overload-example.png)

## Icon Sets

* [Font-Awesome](http://fontawesome.io/)
* [Devicons](http://vorillaz.github.io/devicons)

## Example 

	@startuml

	!includeurl https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/common.puml
	!includeurl https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/font-awesome/server.puml
	!includeurl https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/master/font-awesome/database.puml
	
	title Styling example

	FA_SERVER(web1,web1) #Green
	FA_SERVER(web2,web2) #Yellow
	FA_SERVER(web3,web3) #Blue
	FA_SERVER(web4,web4) #YellowGreen

	FA_DATABASE(db1,LIVE,database,white) #RoyalBlue
	FA_DATABASE(db2,SPARE,database) #Red

	db1 <--> db2

	web1 <--> db1
	web2 <--> db1
	web3 <--> db1
	web4 <--> db1

	@enduml

![styling-example](examples/styling-example.png)


Enjoy!




