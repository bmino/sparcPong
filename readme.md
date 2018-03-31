# Sparc Pong

This ladder currently manages the semi-competitive ping pong scene at Sparc.


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.


### Installing Prerequisites

The following dependencies are required to run an instance of sparc pong:

1. NodeJS
2. Npm
3. Mongodb

Install NodeJS and npm

```
brew install node
```

Install Mongodb

```
brew install mongodb
```

Setup Mongodb root directory
```
sudo mkdir -p /data/db
sudo chmod -R a+w /data
```

## Running the tests

There are currently no tests


## Deployment

Clone the code from github
```
git clone https://github.com/bmino/sparcPong.git
```

Build the project from the root directory
```
npm install
```

Install the cron job plugin
```
npm install cron
```

Start an instance of mongodb in a new terminal tab
```
mongod
```

Start the application
```
npm start
```


## Authors

* **[Brandon Mino](https://github.com/bmino)** - *Project Lead*

See also the list of [contributors](https://github.com/bmino/sparcPong/contributors) who participated in this project.


## License

This project is licensed under mit


*To fellow pong lovers, never stop spinning*
