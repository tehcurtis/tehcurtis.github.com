---
layout: post
title: "Rescue Data From Your Dying Hard Drive With Single-user Mode"
date: 2014-07-28 23:06 -0700
categories: hardware
---

About a week or so ago, the hard drive in my Macbook decided to die. Right in the middle of some very intense work I was doing, all processes slowed to a crawl and the machine locked up. After staying frozen for a few seconds, I got the dreaded screen of death. This had only been maybe the second time I had ever seen that screen in the couple of years I had this Macbook so I didn’t think too much of it.

I rebooted my machine thinking everything would be fine. It started up and began to load through the recovery loading screen, but right before the loading was complete, the machine flat out died. It shut off with no other response. All I had was a black screen. After attempting to start the machine up a few more times and getting the same result, I started to get concerned.

I had a an external hard drive that I had been using for my Time Machine backups so I knew I could get most of my data back but not the project I was furiously working on when this whole debacle started (I hadn’t backed up for a few days). Was there a way I could access the files I was just working on? Turns out there was.

Booting up my mac in single-user mode was the key. To start up in single user mode, hold CMD+S while your mac boots up until it drops you into single user mode. Starting up in single user mode will bring you right to a shell prompt. You will probably notice that the filesystem is in a read-only status. You’ll want to re-mount the filesystem in read-write. Do so via this command:

```bash
/sbin/mount -uw /
```

Now you can attempt to fix your filesystem via fsck but it may not completely fix what ails your drive. It most certainly did not in my case. So I set about trying to copy off my folder of work to my external usb hard drive. First I plugged my usb drive in and made sure the system noticed it. You can do this by checking “ls /dev/” before you plug the usb drive in, and then again after you’ve plugged it in. After you’ve plugged it in, you should notice something new named something like “disk1s1” or “disk1s2”. If you do, that’s your usb device. Next, I created a spot to mount my usb drive via

```shell
 mkdir /Volumes/externalusbdrive
```

Then I actually mounted the drive via

``` shell
/sbin/mount_hfs /dev/disk1s1 /Volumes/externalusbdrive
```

I “ls”’d around a bit on /Volumes/externalusbdrive to make sure everything looked ok and that the external hard drive seemed to be mounted. After I confirmed everything seemed to be in working order, I continued to cp over the folders I needed. You could rsync too if you’d like but meh, cp worked fine for me in this case. Once I had my folder, I unmounted my external usb hard drive via:

``` shell
umount /dev/disk1s1
```

And yes, that’s umount and not “unmount”. Check /dev/ or df to make sure the device appears to be unmounted, it’s safe to go ahead and remove your usb drive, with your work intact. Shut your machine off, replace the hard drive and continue on with your life.

Shout out to [this blog post](http://jsalovaara.com/blog/backing-up-files-to-a-usb-drive-using-single-user-mode.html) and [this blog post](http://alvinalexander.com/mac-os-x/mac-osx-single-user-mode-usb-drive) in walking me through how to do all of this. Much appreciated!
