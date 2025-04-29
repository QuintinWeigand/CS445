use std::collections::VecDeque;

use chrono::Utc;
use chrono_tz::America::New_York;
use serde::{Deserialize, Serialize};

const MAX_HISTORY_COUNT: i32 = 10;

#[derive(Debug, Deserialize, serde::Serialize, Clone)]
pub struct StockTimeIntervals {
    close_price: f64,
    date_and_time: String
}

#[derive(Debug, Deserialize, Serialize)]
pub struct StockHistory {
    ticker: String,
    history: VecDeque<StockTimeIntervals>,
}

impl StockHistory {
    pub fn new(ticker: &str) -> Self {
        Self {
            ticker: ticker.to_string(),
            history: VecDeque::new(),
        }
    }

    pub fn get_ticker(&self) -> &String {
        &self.ticker
    }

    pub fn get_history(&self) -> &VecDeque<StockTimeIntervals> {
        &self.history
    }

    pub fn update(&mut self, close_price: f64) {
        let utc_now = Utc::now();
        let est_now = utc_now.with_timezone(&New_York);

        let interval = StockTimeIntervals {
            close_price: close_price,
            date_and_time: est_now.to_string()
        };

        if self.history.len() >= MAX_HISTORY_COUNT as usize {
            self.history.pop_front();
        }
        self.history.push_back(interval);
    }
}
