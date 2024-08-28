import { fetchTokenMetadata } from "../fetchTokenMetadata";
import { fetchChartDataNew } from '../fetchChartData'; // Adjust the import path if necessary

const configurationData = {
    // Represents the resolutions for bars supported by your datafeed
    supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D', '1W'],
    // The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
    exchanges: [
      { value: 'Birdeye', name: 'Birdeye', desc: 'birdeye' },
    ],
    // The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
    // symbols_types: [
    //     { name: 'crypto', value: 'crypto'}
    // ]
  };

async function getAllSymbols() {
    const tokens = await fetchTokenMetadata();
    const symbols = [];
    tokens.map(token => {
      symbols.push({
        symbol: token.symbol,
        full_name: token.name,
        description: token.address,
        exchange: "birdeye",
        type: 'crypto',
      });
    })
    return symbols;
  }

export const datafeed = {
    onReady: (callback) => {
        console.log('[onReady]: Method call');
        setTimeout(() => callback(configurationData));
    },

    searchSymbols: async (
        userInput,
        exchange,
        symbolType,
        onResultReadyCallback
      ) => {
        console.log('[searchSymbols]: Method call');
        const symbols = await getAllSymbols();
        const   
     lowerCaseInput = userInput.toLowerCase().trim(); // Convert user input to lowercase
    
        const newSymbols = symbols.filter(symbol => {
          const isFullSymbolContainsInput = symbol.full_name.toLowerCase().trim().includes(lowerCaseInput);
          const isSymbolContainsInput = symbol.symbol.toLowerCase().trim().includes(lowerCaseInput);
          return isFullSymbolContainsInput || isSymbolContainsInput;
        });
    
        onResultReadyCallback(newSymbols);
      },

    resolveSymbol: async (
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback,
        extension
    ) => {
        const symbols = await getAllSymbols();
        const symbolItem = symbols.find(({ full_name }) => full_name === symbolName);
        if (!symbolItem) {
            console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
            onResolveErrorCallback('Cannot resolve symbol');
            return;
        }
        // Symbol information object
        const symbolInfo = {
            ticker: symbolItem.full_name,
            name: symbolItem.symbol,
            description: symbolItem.description,
            type: symbolItem.type,
            // session: '24x7',
            timezone: 'Etc/UTC',
            exchange: symbolItem.exchange,
            // minmov: 1,
            // pricescale: 100,
            // has_intraday: false,
            // has_no_volume: true,
            // has_weekly_and_monthly: false,
            supported_resolutions: configurationData.supported_resolutions,
            // volume_precision: 2,
            // data_status: 'streaming',
        };
        console.log('[resolveSymbol]: Symbol resolved', symbolName);
        onSymbolResolvedCallback(symbolInfo);
    },

    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        const { from, to, firstDataRequest } = periodParams;
        console.log('[getBars]: Method call', symbolInfo, resolution, from, to);

        try {
            const data = await fetchChartDataNew(symbolInfo.name, from, to, resolution);
            if (data.length === 0) {
                onHistoryCallback([], { noData: true });
                return;
            }
            let bars = [];
            data.forEach(bar => {
                if (bar.time >= from && bar.time < to) {
                    bars.push({
                        time: bar.time * 1000,
                        low: bar.low,
                        high: bar.high,
                        open: bar.open,
                        close: bar.close,
                    })
                }
            });
            console.log(`[getBars]: returned ${bars.length} bar(s)`);
            onHistoryCallback(bars, { noData: false });
        } catch (error) {
            console.log('[getBars]: Get error', error);
            onErrorCallback(error);
        }
    },

    subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
        console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
    },
    unsubscribeBars: (subscriberUID) => {
        console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
    },
};