---
title: Homelab Introduction
description: My Nextgen Homelab
date: 2023-07-21
categories:
  - homelab
tags:
  - homelab
series:
  name: Homelab
type: series
---

I've gone through many iterations of my homelab over the years. It usually
involves completely rewriting everything - but that's just a part of the
learning process.

I started from manually setting up a server, adding automation with Ansible,
containerizing applications with Docker and docker-compose, to running a
Kubernetes cluster on my Dell R620 I snagged off of
[/r/homelabsales](https://reddit.com/r/homelabsales).

My latest setup has been pretty awesome, but it's time for an upgrade. In this
series, I will document my learning process and decisions. Hopefully you will
find this interesting. There are many things that I still don't know and I'll be
figuring them out along the way. Feedback and suggestions are always
appreciated.

## Current Setup

- Dell 620 running [Proxmox](https://www.proxmox.com/en/)
- [Terraform](https://www.terraform.io/) to automate provisioning of 3 control
  planes and 2 worker nodes with [Ubuntu Server
  cloud-init](https://cloud-images.ubuntu.com/) image
- Ansible to provision [k3s](https://k3s.io/) and other Ubuntu stuff™
- [fluxcd](https://fluxcd.io/) to deploy changes to my Kubernetes cluster from
  GitHub.

{{< figure
      src="/posts/homelab/2023-07-21-introduction/server.jpeg"
      caption="My server rack" >}}

This setup has been chugging along for about a year without huge issues, though
there are some pain points I'd like to fix. Also, shout out to the folks who
contributed to the [k8s-at-home](https://k8s-at-home.com/) project. I've gained
a lot of inspiration.

My family has been relying on apps running at home more and more over time. My
hobby becoming useful is a great problem to have, but it has become more
critical to FamOps.

## Goals

In this iteration of my home infrastructure, these are the goals I'm hoping to
accomplish:

1. Ease of maintainance. Things just work for the most part, and adding new
   services is easy.
2. Automate as much as possible and easily repeatable in case I need to wipe
   machines away.
3. Don't attempt to automate everything. Maintaining automation can be difficult
   when some things break, and you come back to fixing it 6 months later. For
   simple stuff, written down manual steps can be just as good.
4. Services are secure and up to date.
5. Maintain reasonable uptime.

These are just my initial thoughts and will be refined as I go. In the
following posts, we'll dive more into the actual progress. Thanks for reading!
