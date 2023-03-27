# DApIA project : ADS-B data visualization

Open online version :
[adsb-visualizer.web.app](https://adsb-visualizer.web.app/)

## Description

This project is a web application that allows to visualize ADS-B data alterations in real time. The data is provided by the [OpenSky Network](https://opensky-network.org/).

## Keyboard bindings

<!-- display keybord actions -->
* `Space` : play/pause the visualization
* `Left Arrow` : go back in time
* `Right Arrow` : go forward in time
* `Up Arrow` : double the visualization speed
* `Down Arrow` : half the visualization speed

## Installation

<!-- display the npm command to init and install the project -->

Initialise the project with npm :
```bash
npm init
```
Install the project dependencies :
```bash
npm install
```
Compile and run the project :
```bash
npm run start
```

## Used technologies

* [Leaflet](https://leafletjs.com/)
    * map display
* [Parcel](https://parceljs.org/)
    * Code bundling + Server management
* [TypeScript](https://www.typescriptlang.org/)
    * type checking for better code quality
* [SCSS](https://sass-lang.com/)
    * imrpoved CSS preprocessor
* [PostHTML](https://posthtml.org/)
    * HTML templating

## Code Tree

The project is organized as follow :
<!-- display the tree -->
```bash
├── dist # compiled files
├── node_modules
├── src 
│   ├── assets # static files
│   │   ├── data # database of aircrafts types (plane, helicopter, etc.)
│   │   │   └── aircrafts.txt
│   │   ├── fonts
│   │   └── images
│   ├── html # html subpages (header, sub-windows, etc.)
│   ├── scripts
│   ├── styles
│   │   ├── global # always loaded -> contain colors, fonts, styles, etc.
│   │   ├── large # sizes for large screens
│   │   ├── small-height # sizes for small screens (landscape)
│   │   ├── small-width # sizes for small screens (portrait)
│   │   ├── utils # utility classes (buttons, inputs, etc.)
│   │   └── style.scss # main stylesheet -> coordinates all the css files
│   └── index.html
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```



## Example files

The folder `example` contains some flight in `.sbs` and `.csv` format.

You can use these files to test the application by dropping the files you want into it.




