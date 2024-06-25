---
layout: post
title: How to remotely debug your code on compute nodes of the SLURM-based HPC cluster without admin rights?
subtitle: STEP BY STEP TUTORIAL
gh-repo: jbartolewska/debug-slurm-hpc
gh-badge: [star, follow]
mathjax: true
author: Julitta Bartolewska
---

<div align="justify" markdown="1">

In order to debug your code on the HPC cluster directly utilizing allocated via SLURM compute nodes equipped with GPUs, you can use the browser-based version of the Visual Studio Code (VSC) and hence remotely go through code line by line utilizing multiple user-friendly features of VSC. And… YOU DO NOT NEED THE SUDO PERMISSIONS! Let me walk you through it and explain how to configure the environment step by step.

Soooo, in general, the pipeline is constructed such that you run a batch job on the HPC cluster that starts the browser-based VSC on the allocated resources (the compute node) and then you can access it through the browser on your local machine by creating a ssh tunnel to the remote server.

### **⬇️STEP (0)⬇️**
Let’s start! Firstly, login into the HPC cluster and being on the login node install the open-sourced [code-server](https://github.com/coder/code-server) software. It runs the VSC and makes it accessible through the browser as a web-based application. Note that without having the admin rights, you are interested in installing a [standalone release](https://coder.com/docs/code-server/latest/install#standalone-releases). So check the version of the [latest release](https://github.com/coder/code-server/releases), save it in the environment variable using command `export VERSION=<VERSION>` (e.g. `export VERSION=4.90.3`), and then run each of the following lines:

```bash
mkdir -p ~/.local/lib ~/.local/bin
curl -fL https://github.com/coder/code-server/releases/download/v$VERSION/code-server-$VERSION-linux-amd64.tar.gz \
  | tar -C ~/.local/lib -xz
mv ~/.local/lib/code-server-$VERSION-linux-amd64 ~/.local/lib/code-server-$VERSION
ln -s ~/.local/lib/code-server-$VERSION/bin/code-server ~/.local/bin/code-server
PATH="~/.local/bin:$PATH"
```

The code-server is now installed on the remote server! Note that by adding `~/.local/bin` to your `$PATH`, the installed software can now be simply run by typing `code-server`.

### **⬇️STEP (1)⬇️**
Next, having the code-server installed on the remote HPC cluster, let’s create a `run_code_server.sh` bash script as the one presented below. It will automatically run the code-server on a particular node it will be invoked by, at the same time making it accessible through a randomly chosen port and saving the ssh command (under the path `$HOME/VSCode_tunnel`) that will enable further local port forwarding and so establishing the secure tunnel between your localhost port and the chosen port of a remote node. Note that to run this script, you need to pass the local port number as the first input argument. Moreover, in order to keep the connection alive between your local machine and HPC cluster’s node during debugging, the `ServerAliveInterval` option is added to the ssh command.

```bash
#!/bin/bash

local_port=$1
port=$(shuf -i 8000-9999 -n 1)
ip=$(hostname -i)
login_hostname=$SLURM_SUBMIT_HOST
echo "ssh -o ServerAliveInterval=60 -NfL localhost:${local_port}:${ip}:${port} ${USER}@${login_hostname}" > $HOME/VSCode_tunnel

PATH="~/.local/bin:$PATH"
code-server --bind-addr=${ip}:${port} .
```

### **⬇️STEP (2)⬇️**
And… the final step is to prepare the SLURM job submission script that will be responsible for allocating the right amount of resources you need for debugging your code, and then it will execute the `run_code_server.sh` file initiating the code-server instance on the compute node. So, let’s create a `run_debug_job.sh` file as presented in the following. Remember to adjust SLURM job options to your needs and fill in the missing information `<.>`. You can also freely modify the localhost port number, which is arbitrarily set here to 8282 and passed to `run_code_server.sh`.

```bash
#!/bin/bash
#SBATCH --account <GPU-ACCOUNT-NAME>
#SBATCH --job-name <JOB-NAME>
#SBATCH --nodes 1
#SBATCH --ntasks-per-node=1
#SBATCH --cpus-per-task=2
#SBATCH --mem=10GB
#SBATCH --time=02:00:00
#SBATCH --partition <PARTITION-NAME>
#SBATCH --gres=gpu:1
#SBATCH --output=<OUTPUT-FILEPATH-PATTERN>

# below add all the modules you’ll need to debug your code
# module add XYZ
srun ~/run_code_server.sh 8282
```

### **🎉VOILÀ!🎉**
Now you can simply run the batch job submission script on the login node using command `sbatch ./run_debug_job.sh`, wait for the job to start and then by typing `cat ~/VSCode_tunnel` on the login node print the file containing the ssh command saved by the `run_code_server.sh` script. Copy-paste printed output into your local machine terminal and… the VSC running on the compute node is accessible via browser with `http://localhost:8282/` URL! Note that the first time login will require password authentication, you just need to follow the displayed instructions.

And remember that each time you run the presented batch job and execute the resulting ssh command, port 8282 on your local machine is forwarded to the remote one, so after finishing the job and before connecting again you need to ensure that your local port is released. For example, you can close the previous ssh local port forwarding by killing the ssh process with command `pkill -9 -f 'ssh .* -NfL'`.

<h3 align="center" style="margin: 30px;"><b>Happy debugging! ✖🐛✖</b></h3>

**PS.1.** Having ONLY debugging in your mind, be careful with allocating the right amount of resources within the SLURM job! Please stay resource-friendly with other users! 💕

**PS.2.** Don't forget to star this [repository](https://github.com/jbartolewska/debug-slurm-hpc) if you find it helpful! ⭐

</div>