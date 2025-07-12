# 🐕 DoggoRoomie Web Controller

<img src="/doggo-roomie.png" alt="DoggoRoomie Robot" title="DoggoRoomie Robot" width="300" />

Welcome to the DoggoRoomie - Fluffy Tightrope Web Controller repository! This project provides web-based applications designed to control a zoomorphic dog-like robot, developed as part of our study:

> "The Fluffy Tightrope - Examining Zoomorphic Robot Interactions For Promoting Active Behavior In A Comfortable Setting."

## 📋 Overview

This repository contains the necessary tools to manage and control the robot's movement and interactions.

## 🔧 Requirements

- [Deno Runtime](https://deno.land/manual/getting_started/installation)

## 🏗️ Project Structure

The project consists of two parts:

1. **Main Controller App** - Root of this repository, runs locally via localhost
2. **Web Deployed Face** - Located in `/web_deployed_face.zip`, needs to be deployed on the web

Both components use Deno (a modern alternative to NodeJS) as their runtime.

## 🚀 Setup & Usage

### Network Configuration

1. Ensure the device running this controller app is connected to the same airlink router (2.4 GHz!) as:
   - The vacuum robot (Valetudo)
   - The Arduino (Feather ESP8266)
   - The Samsung Tablet

2. Configure the IP addresses in `/public/config.js` to match the actual IP addresses of devices in your local network

(The current router shows ip adresses of connected devices on its webinterface under http://192.168.1.1/)

### Hardware Setup

1. Connect the battery to the Arduino and the servo motor
2. Make sure the robot vacuum is turned on

### Running the Application

1. On the tablet, open Chrome and visit the robot dog face website:
   - URL: https://remote-dog-face-123.deno.dev/
   - If not hosted anymore, deploy the content of `/web_deployed_face.zip` yourself 
     (Recommended services: Deno Deploy or Netlify)

2. Start the controller app:
   ```
   deno --allow-net --allow-read main.ts
   ```

3. Access the interface at: http://localhost:3000

The keyboard controls are displayed in the interface. Enjoy!
