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

My latest setup has been pretty awesome. My homelab consists of:

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

I want to ensure services running at home are easy to maintain, secure, and
_reasonably_ highly available. So here I am, getting the itch to level up my
infrastructure again. I plan on keeping my current stack running for now
alongside, so it won't be a complete rewrite from scratch. There are things
that I still don't know. My aim with this series is to document my learning
along the way and hope people find them interesting at the same time.

That's it for now - see you in the next post!
