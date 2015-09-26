Vagrant.configure('2') do |config|
    config.vm.box = 'ubuntu/trusty64'
    config.vm.synced_folder './', '/opt/sourcestats'

    config.vm.provider 'virtualbox' do |vb|
        vb.cpus = 2
        vb.memory = 2048
        vb.customize ['modifyvm', :id, '--natdnshostresolver1', 'on']
    end

    config.vm.define 'sourcestats' do |sourcestats|
        sourcestats.vm.network :private_network, ip: '10.10.10.10'
    end
end
