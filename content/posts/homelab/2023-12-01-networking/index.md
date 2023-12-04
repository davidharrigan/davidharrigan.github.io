---
title: Home Networking Setup
date: 2023-12-01
categories:
  - homelab
tags:
  - homelab
series:
  name: Homelab
type: series
---

First order of business is establishing how my network is setup.
There are two main problems I want to solve.

1. Making sure my network is secure. Devices should not have free-for-all
   access to everything on the home network.
2. I don't want to deal with IPs (as much as possible) for the services running
   at home. IPs often become a chore and I don't want to think about them - I want
   to treat my services as cattles, not pets. I _need_ DNS.

## VLAN

VLAN partitions a network into multiple logical networks. As an example, IoT
devices can be a part of a VLAN. This allows control of what the IoT devices can
and cannot access. Growing number of devices connected to a network increases
the surface area for a potential attack from a bad actor gaining access an
insecure device. Having the ability to partition and control network access is
critical to keeping your important data and devices away from threats.

My current hardware is the TP-Link Omada stack which I will be using to create
VLANs and configure my network.

{{< figure
      src="/posts/homelab/2023-12-01-networking/networking-devices.png"
      alt="my networking devices" >}}

- 16 port switch [TL-SG2218 ](https://a.co/d/9FQY8Cy)
- 8 port PoE switch [TL-SG2210MP](https://a.co/d/hABgCyD)
- Router [TP-Link ER605](https://a.co/d/98ADwa8)
- Omada hardware controller [OC200](https://a.co/d/1O6YGqZ)

I'm going to organize my network into the following segments:

| VLAN       | CIDR              |
| ---------- | ----------------- |
| Management | `192.168.10.0/24` |
| Users      | `192.168.20.0/24` |
| Servers    | `192.168.42.0/24` |
| IoT        | `192.168.50.0/24` |

**Management** is the most restricted space and should only be accessible from
**Users**. This segment includes: Proxmox, Dell iDRAC interface, and the
networking devices.

**Users** contains all of the personal devices.

**Services** is the fun part, this contains all physical and virtual machines,
as well as some virtual IPs.

**IoT** contains all the smart devices. These should only be able to speak to
the internet, and are cutoff from connecting to other devices on the network.
This _might_ need some tweaking later depending on the device.

And what each VLAN can access:

| VLAN       | Access |
| ---------- | ------ |
| Management | All    |
| Users      | All    |
| Servers    | IoT    |
| IoT        | None   |

I think this is a good enough starting point. I plan to apply some revisions when it makes sense to do so like:

- VLAN for guests.
- VLAN for IP cameras.
- Locking down access to `Management` from `Users`.
- Access rule for `IoT` devices, some devices might need access to `Servers` and
  `Users` VLAN.

## DNS and DHCP

If you're not familiar, DHCP is a service that assigns IP addresses to devices
on a network. Your router usually runs this service. DNS translates domain names
like `google.com` and `db-1.lan` IP addresses that computers use to identity
each other.

To limit the use of IPs, I would like to use DNS as much possible. It's
difficult having to remember IPs and organize them in logical formats for
different services as the number of services grow and shrink. I also would
prefer not to create DNS records for my local services manually.

DNS and DHCP work nicely together to automatically resolve local hostnames.

Ideally, my router can take on this task, but [Omada sadly doesn't have a DNS
server](https://community.tp-link.com/en/business/forum/topic/542472). Hopefully
is implemented at some point. At some point, I'd like to get a machine running
[opnsense](https://opnsense.org/) so that critical services like DNS and DHCP
can run in an "network appliance".

After looking at several options, I decided on using
[pihole](https://pi-hole.net/) for DNS and DHCP. `pihole` uses `dnsmasq` under
the hood which supports both of these protocols. I am using Ansible to install
`pihole`, but the [official
methods](https://github.com/pi-hole/pi-hole/#one-step-automated-install) are
pretty straightfoward. (Shout out
[r-pufky/ansible_pihole](https://github.com/r-pufky/ansible_pihole) for the
Ansible role I'm using).

### Using PiHole for DNS

PiHole is deployed in my `Servers` VLAN. This is one of the only service where I
assign a fixed IP of `192.168.42.10`.

Using PiHole for DNS is very simple. After all, that's kinda its purpose. All
that's required is to change some configuration to use `192.168.42.10` (or
whatever the IP of your PiHole is) as the primary DNS server. I'm also using
`1.1.1.1` as my secondary DNS so my machines can continue to resolve DNS if for
some reason PiHole is not operational. I applied this configuration at my router
for `Management`, `Servers`, and `Users` VLANs so that the devices in these
networks use PiHole by default for DNS.

### Using PiHole for DHCP

This is the magical part. By using the DHCP server on PiHole, PiHole can
automatically assign DNS based on the machine's hostname when the DHCP server
assigns an IP.

DHCP is a critical service, if it's down, IPs cannot be assigned. I'm only using
PiHole DHCP for devices in the `Servers` VLAN to limit the blast radius. Only
these devices will automatically receive a DNS name - which is fine by me.

In the `DHCP` tab of PiHole Settings page, make sure the DHCP server is enabled.
Then assign the range of IP addresses that DHCP server will handout. This is
important to ensure any static IPs do not conflict with IPs DHCP will assign. I
set my range to `192.168.42.100` - `192.168.42.250`. Router Gateway in my case is
`192.168.42.1`.

Specify `Pi-hole` domain name under `Advanced DHCP settings`. I set mine to
`lan`. This makes it so that DNS record assigned to devices become
`<hostname>.<pi-hole-domain>`.

The result of this configuration will look like:

{{< figure
      src="/posts/homelab/2023-12-01-networking/dhcp-leases.png"
      alt="dhcp leases" >}}

Where I can access my NAS by using `nas-1.lan`, etc.

## Wrapping Up

I used VLAN to segment my local network into four, and configured access policy
to tighten communication between devices.

I also used PiHole as by DNS/DHCP solution so that I don't have to care about IP
addresses as much and resolve servers using DNS. We'll dive into DNS a little
more in the future for services running in containers.

### Result

| VLAN       | CIDR              |
| ---------- | ----------------- |
| Management | `192.168.10.0/24` |
| Users      | `192.168.20.0/24` |
| Servers    | `192.168.42.0/24` |
| IoT        | `192.168.50.0/24` |

| Fixed IP   | IPs                               |
| ---------- | --------------------------------- |
| DNS / DHCP | `192.168.42.10`                   |
| DHCP Range | `192.168.42.100 - 192.168.42.250` |
