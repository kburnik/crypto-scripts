#!/usr/bin/env python

# Displays the crypto ticker from worldcoinindex.com in your terminal.
#
# Install requirements.
#
# $ pip install requests requests_cache si-prefix
#
# Grab your key at:
#   https://www.worldcoinindex.com/apiservice
#
# Add to .bashrc:
#   export WORLD_COIN_INDEX_API_KEY="yourkey"
#   export WORLD_COIN_INDEX_MAX_ITEMS=40
#   alias btc="python $HOME/crypto-scripts/wci.py"
#
# Start using:
# $  source ~/.bashrc
# $  btc

import json
import requests
import requests_cache
import os
import sys
from si_prefix import si_format

os.chdir(os.path.dirname(__file__))

requests_cache.install_cache('test_cache', backend='sqlite', expire_after=5 * 60)


url = ('https://www.worldcoinindex.com/apiservice/getmarkets' +
       '?key=%(WORLD_COIN_INDEX_API_KEY)s&fiat=USD') % os.environ

max_items = int(os.environ.get('WORLD_COIN_INDEX_MAX_ITEMS', "40"))

ticker = requests.get(url).json()

if not 'Markets' in ticker:
  print ticker
  sys.exit(1)

data = ticker['Markets'][0]
data = sorted(data, key=lambda item: -item['Volume_24h'])

print "%20s %9s    %12s   %10s" % ('Name', 'Market', 'Price', 'Volume 24h')

for item in data[0:max_items]:
 print "%20s %9s    $ %10.4f   %10s" % (item['Name'], item['Label'], item['Price'], si_format(item['Volume_24h']))
