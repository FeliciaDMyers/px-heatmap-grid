/**
 * Created by ricardobreder on 12/22/16.
 */
Polymer({

  is: 'ev-heatmap-table',

  properties: {
    /**
     * This property holds the data.
     *
     * @property data
     */
    data: {
      type: Object,
      value: [],
      notify: true,
      observer: '_dataChanged'
    },

    /**
     * This property holds the rendered data
     *
     * @property heatmapData
     */
    heatmapData: {
      type: Object,
      value: []
    },

    /**
     * This property holds the config info
     *
     * @property config
     */
    config: {
      type: Object,
      value: {
        "minValue": 0,
        "maxValue": 0,
        "startColor": [],
        "endColor": [],
        "factors" : []
      },
      observer: '_configChanged'
    },
    /**
     * This property holds the scale set by the user
     *
     * @property scale
     */
    scale: {
      type: Array,
      value: [0, 100],
      observer: '_scaleChanged'
    },

    /**
     * This property controls when to show/hide the Column Headers
     *
     * @property hideColHeader
     */
    hideColHeader: {
      type: Boolean,
      value: false,
      observer: '_hideColHeaderChanged'
    },

    /**
     * This property controls when to show/hide the Row Headers
     *
     * @property hideRowHeader
     */
    hideRowHeader: {
      type: Boolean,
      value: false,
      observer: '_hideRowHeaderChanged',
    },

    /**
     * This property controls when to show/hide the Values in the cells
     */
    hideValues: {
      type: Boolean,
      value: false
    },

    /**
     * This property sets the aggregation method
     *
     * @property aggregationType
     */
    aggregationType: {
      type: String,
      value: "",
      observer: '_calculateAggregation'
    },

    /**
     * This property controls when to show/hide the Aggregations
     *
     * @property showAggregation
     */
    showAggregation: {
      type: Boolean,
      value: false,
      observer: '_showAggregationChanged'
    },

    /**
     * This property contains all the available aggregation types
     *
     * @property availableAggregations
     */
    availableAggregations: {
      type: Array,
      value: [
        "AVERAGE",
        "MAX",
        "MIN",
        "SUM",
        "COUNT",
        "STD"
      ]
    },

    /**
     * This property contains the Scale From color.
     *
     * @property scaleColorFrom
     */
    scaleColorFrom: {
      type: String,
      observer: '_scaleColorFromChanged'
    },

    /**
     * This property contains the Scale To color.
     *
     * @property scaleColorTo
     */
    scaleColorTo: {
      type: String,
      observer: '_scaleColorToChanged'
    }
  },

  attached: function() {
    this._dataChanged(this.data, []);
    this._configChanged(this.config, {});

    // Hack to get cell max width set with sass
    var tempEl = document.createElement('div');
    tempEl.style.display = 'none';
    tempEl.classList.add('table-cell');
    Polymer.dom(this.root).appendChild(tempEl);
    this.set('cellMaxWidth', window.getComputedStyle(tempEl).maxWidth);
    Polymer.dom(this.root).removeChild(tempEl);
  },

  _dataChanged: function(newData, oldData) {
    var self = this;
    if(newData != oldData && newData && newData.length) {
      var rows = [];
      var cols = [];
      var tableData = [];
      var nColor = [];
      var iRow = -1;
      var iCol = -1;

      if (Array.isArray(newData[0])) {
        newData.forEach(function (colArr, i) {
          colArr.forEach(function (value, j) {
            if(!tableData[j]) tableData.push([]);
            nColor = self.config != undefined ? self._calculateColor(value) : [255, 255, 255];
            tableData[j][i] = {
              "value": value,
              "color": "background-color: rgb(" + nColor[0] + "," + nColor[1] + "," + nColor[2] + ");"
            };
          });
        });
      }
      else if (typeof newData[0] !== "object" && typeof newData[0] !== "string") {
        newData.forEach(function (value, i) {
          nColor = self.config != undefined ? self._calculateColor(value) : [255, 255, 255];
          tableData.push( [{
            "value": value,
            "color": "background-color: rgb(" + nColor[0] + "," + nColor[1] + "," + nColor[2] + ");"
          }]);
        });
      }
      else if (typeof newData[0] === "object" && newData[0].values) {
        newData.forEach(function (cell, i) {
          iRow = cell.row ? rows.indexOf(cell.row) : -2;
          iCol = cell.col ? cols.indexOf(cell.col) : -2;
          if (iCol === -2) {
            rows.push(cell.row);
          };
          if (iRow === -2) {
            cols.push(cell.col);
          };
          cell.values.forEach(function (value, j) {
            nColor = self.config != undefined ? self._calculateColor(value) : [255, 255, 255];
            if (iCol === -2) {
              if (i === 0 ) tableData.push([]);
              tableData[j].push({
                "value": value,
                "color": "background-color: rgb(" + nColor[0] + "," + nColor[1] + "," + nColor[2] + ");"
              });
            }
            else {
              if (j === 0 ) tableData.push([]);
              tableData[i].push({
                "value": value,
                "color": "background-color: rgb(" + nColor[0] + "," + nColor[1] + "," + nColor[2] + ");"
              });
            }
          });
        });
      }
      else if (typeof newData[0] !== "string") {
        newData.forEach(function (cell) {
          iRow = rows.indexOf(cell.row);
          iCol = cols.indexOf(cell.col);
          if (iCol === -1) {
            cols.push(cell.col);
            tableData.push([]);
            iCol = cols.length - 1;
          };
          if (iRow === -1) {
            rows.push(cell.row);
            iRow = rows.length - 1;
          };
          nColor = self.config != undefined ? self._calculateColor(cell.value) : [255, 255, 255];
          tableData[iCol][iRow] = {
            "value": cell.value,
            "color": "background-color: rgb(" + nColor[0] + "," + nColor[1] + "," + nColor[2] + ");"
          };
        });
      };

      this.set("heatmapData", []);
      this.set("rows", rows);
      this.set("cols", cols);
      this.set("heatmapData", tableData);
      this._calculateAggregation(this.aggregationType, "");
      this._hideColHeaderChanged(false, true);
      this._hideRowHeaderChanged(false, true);

      if (this.rows && this.rows.length) {
        this.initialRowsOrder = this.rows.map(function (el, i) {
          return {
            "index": i,
            "value": el
          }
        });
      }

      if (this.cols && this.cols.length) {
        this.initialColsOrder = this.cols.map(function (el, i) {
          return {
            "index": i,
            "value": el
          }
        });
      }
    }
  },

  _calculateColor: function(value) {
    var config = this.config;
    var color = [];
    return value < config.minValue ? config.minValue : value > config.maxValue ? config.maxValue : config.factors.map(function (x, i) {
      return Math.round(x * value) + config.startColor[i];
    })
  },

  _configChanged: function(newConfig, oldConfig) {
    if(newConfig !== oldConfig && newConfig) {
      var config = this.config;
      if(this.scaleColorFrom) {
        config.startColor = this.scaleColorFrom.replace(/[^\d,]/g, '').split(',').map(function (x) {
          return x / 1;
        });
      }
      if(this.scaleColorTo) {
        config.endColor = this.scaleColorTo.replace(/[^\d,]/g, '').split(',').map(function (x) {
          return x / 1;
        });
      }
      nValues = config.maxValue - config.minValue;
      config.factors = config.endColor.map(function(c,i) {
        return (c - config.startColor[i]) / nValues;
      });
      var data = [].concat(this.data);
      this.set("data", data);
    }
  },

  _scaleChanged: function(newScale, oldScale) {
    if(newScale !== oldScale && newScale && newScale.length === 2) {
      var config = this.config;
      config.minValue = newScale[0];
      config.maxValue = newScale[1];
      this.set("config", config);
      this._configChanged(config, {});
    }
  },

  _getColHeader: function(iCol) {
    return this._resizeHeader(this.cols[iCol]);
  },

  _hideColHeaderChanged: function(newValue, oldValue) {
    var rowHeader = Polymer.dom(this.root).querySelector(".table-row-header");
    var scale = Polymer.dom(this.nextElementSibling.root).querySelector(".scale-container");
    if (newValue !== undefined && newValue !== oldValue) {
      if (rowHeader) {
        newValue === false ? rowHeader.classList.remove("disable-col-header") : rowHeader.classList.add("disable-col-header");
      }
      if (scale) {
        newValue === false ? scale.classList.remove("disable-col-header") : scale.classList.add("disable-col-header");
      }
    };
    if (newValue !== undefined && newValue === false && newValue !== oldValue && this.cols && (!this.cols.length || !this.cols[0])) {
      this.hideColHeader = true;
      if (rowHeader) rowHeader.classList.add("disable-col-header");
      if (scale) scale.classList.add("disable-col-header");
    }
  },

  _sortCol: function(e) {
    var col = e.model.index,
      order = this.sortColOrder ? this.sortColOrder.index === col ? this.sortColOrder.order === 2 ? 0 : ++this.sortColOrder.order : 0 : 0,
      _this = this,
      temp, newData, rows, newRows;

    this.sortColOrder = {
      "index": col,
      "order": order
    };

    if (order < 2) {
      temp = this.heatmapData[col].map(function (el, i) {
        return {
          "index": i,
          "value": el ? typeof el.value === "number" ? el.value : -Infinity : -Infinity
        }
      });
      temp.sort(function (a, b) {
        return order ? b.value - a.value : a.value - b.value;
      });
    }
    else {
      temp = [];
      this.initialRowsOrder.forEach(function (r) {
        temp.push({
          "index": _this.rows.indexOf(r.value)
        });
      });
    }
    newData = this.heatmapData.map(function(hd) {
      return temp.map(function(t) {
        return hd[t.index];
      });
    });
    rows = this.rows;
    newRows = temp.map(function(t) {
      return rows[t.index];
    });
    this.set("heatmapData", []);
    this.set("rows", []);
    this.set("heatmapData", newData);
    this.set("rows", newRows);
  },

  _sortRow: function(e) {
    var row = e.model.index,
      order = this.sortRowOrder ? this.sortRowOrder.index === row ? this.sortRowOrder.order === 2 ? 0 : ++this.sortRowOrder.order : 0 : 0,
      _this = this,
      temp, hd, newData, cols, newCols;

    this.sortRowOrder = {
      "index": row,
      "order": order
    };
    if (order < 2) {
      temp = this.heatmapData.map(function (el, i) {
        return {
          "index": i,
          "value": el[row] ? typeof el[row].value === "number" ? el[row].value : -Infinity : -Infinity
        }
      });
      temp.sort(function (a, b) {
        return order ? b.value - a.value : a.value - b.value;
      });
    }
    else {
      temp = [];
      this.initialColsOrder.forEach(function (r) {
        temp.push({
          "index": _this.cols.indexOf(r.value)
        });
      });
    }
    hd = this.heatmapData;
    newData = temp.map(function(t) {
      return hd[t.index];
    });
    cols = this.cols;
    newCols = temp.map(function(t) {
      return cols[t.index];
    });
    this.set("cols", []);
    this.set("heatmapData", []);
    this.set("cols", newCols);
    this.set("heatmapData", newData);
  },

  _sortingIcon: function(i,h,d) {
    if (this.sortColOrder && h.toLowerCase() === 'col') {
      return this.sortColOrder.index === i ? d.toLowerCase() === 'up' ? this.sortColOrder.order === 0 ? false : true : this.sortColOrder.order === 1 ? false : true : true;
    }
    else if (this.sortRowOrder && h.toLowerCase() === 'row') {
      return this.sortRowOrder.index === i ? d.toLowerCase() === 'up' ? this.sortRowOrder.order === 0 ? false : true : this.sortRowOrder.order === 1 ? false : true : true;
    }
    return true;
  },

  _calculateAggregation: function(n, o) {
    if(this.aggregationType && this.aggregationType != null && n && n !== o && this.availableAggregations && this.availableAggregations.indexOf(n.toUpperCase()) !== -1 && this.heatmapData.length > 0) {
      this.set("showAggregation", true);
      var rowAggregation = [],
        colAggregation = [],
        data = this.heatmapData.map(function(hd) {
          return hd.map(function(v) {
            return v.value;
          });
        }),
        colDigits = data.map(function(hd) {
          return hd.map(function(a) {
            if (a && typeof a === "number") {
              var temp = (a + "").split(".");
              temp = temp[1] ? temp[1].length : 0;
              return temp;
            }
            return 0;
          }).reduce(function(a, b, i) {
            return i === 0 ? b : a > b ? b : a;
          });
        }),
        rowDigits = data[0].map(function(hd, i) {
          return data.map(function(a) {
            if (a[i] && typeof a[i] === "number") {
              var temp = (a[i] + "").split(".");
              temp = temp[1] ? temp[1].length : 0;
              return temp;
            }
            return 0;
          }).reduce(function(a, b, i) {
            return i === 0 ? b : a > b ? b : a;
          });
        });
      this.set("rowAggregatedData", []);
      this.set("colAggregatedData", []);
      switch (n.toUpperCase()) {
        case "SUM":
          rowAggregation = data[0].map(function(c, i) {
            return data.reduce(function(a, b) {
              return a + (b[i] && typeof b[i] === "number" ? b[i] : 0)
            }, 0);
          });
          colAggregation = data.map(function(c) {
            return c.reduce(function(a, b) {
              return a + (b && typeof b === "number" ? b : 0);
            }, 0);
          });
          break;
        case "AVERAGE":
          rowAggregation = data[0].map(function(c,i) {
            return (data.reduce(function(a, b) {
              return a + (b[i] && typeof b[i] === "number" ? b[i] : 0)
            }, 0)) / data.reduce(function(a, b) {
                return a + (b[i] && typeof b[i] === "number" ? 1 : 0);
              }, 0);
          });
          colAggregation = data.map(function(c, i) {
            return c.reduce(function(a, b) {
              return a + (b && typeof b === "number" ? b : 0);
            }, 0) / data[i].reduce(function(a, b) {
                return a + (b && typeof b === "number" ? 1 : 0);
              }, 0);
          });
          break;
        case "STD":
          rowAggregation = data[0].map(function(c,i) {
            return (data.reduce(function(a, b) {
                return a + (b[i] && typeof b[i] === "number" ? b[i] : 0)
              }, 0)) / data.reduce(function(a, b) {
                return a + (b[i] && typeof b[i] === "number" ? 1 : 0);
              }, 0);
          });
          rowAggregation = data[0].map(function (c, i) {
            return Math.sqrt((data.reduce(function (a,b) {
              return a + (b[i] && typeof b[i] === "number" ? Math.pow((b[i] - rowAggregation[i]), 2) : 0);
            }, 0)) / data.reduce(function (a, b) {
                return a + (b[i] && typeof b[i] === "number" ? 1 : 0);
              }, 0));
          });
          colAggregation = data.map(function(c, i) {
            return c.reduce(function(a, b) {
                return a + (b && typeof b === "number" ? b : 0);
              }, 0) / data[i].reduce(function(a, b) {
                return a + (b && typeof b === "number" ? 1 : 0);
              }, 0);
          });
          colAggregation = data.map(function (c, i) {
            return Math.sqrt((c.reduce(function (a, b) {
              return a + (b && typeof b === "number" ? Math.pow((b - colAggregation[i]), 2) : 0);
            }, 0)) / data[i].reduce(function (a, b) {
                return a + (b && typeof b === "number" ? 1 : 0);
              }, 0));
          });
          break;
        case "MAX":
          rowAggregation = data[0].map(function(c, i) {
            return data.reduce(function(a, b) {
              return typeof b[i] === "number" ? a > b[i] ? a : b[i] : a;
            }, -Infinity);
          });
          colAggregation = data.map(function(c) {
            return c.reduce(function(a, b) {
              return typeof b === "number" ? a > b ? a : b : a;
            }, -Infinity);
          });
          break;
        case "MIN":
          rowAggregation = data[0].map(function(c, i) {
            return data.reduce(function(a, b) {
              return typeof b[i] === "number" ? a < b[i] ? a : b[i] : a;
            }, Infinity);
          });
          colAggregation = data.map(function(c) {
            return c.reduce(function (a, b) {
              return typeof b === "number" ? a < b ? a : b : a;
            }, Infinity);
          });
          break;
        default: //COUNT
          rowAggregation = data[0].map(function (c, i) {
            return data.reduce(function (a, b) {
              return a + (b[i] && typeof b[i] === "number" ? 1 : 0);
            }, 0);
          });
          colAggregation = data.map(function (c, i) {
            return data[i].reduce(function (a, b) {
              return a + (b && typeof b === "number" ? 1 : 0);
            }, 0);
          });
      }

      colAggregation = colAggregation.map(function (v, i) {
        return (v + "").substr(0, (v + "").split(".")[0].length + 2 + colDigits[i]);
      });
      rowAggregation = rowAggregation.map(function (v, i) {
        return (v + "").substr(0, (v + "").split(".")[0].length + 2 + rowDigits[i]);
      });
      this.set("rowAggregatedData", rowAggregation);
      this.set("colAggregatedData", colAggregation);
    }
    else if(this.aggregationType && o && n && o !== n && this.availableAggregations.indexOf(n.toUpperCase()) === -1) {
      this.set("aggregationType", "");
      this.set("showAggregation", false);
    }
  },

  _getColAggregation: function(i) {
    return this.colAggregatedData ? this.colAggregatedData[i] : '';
  },

  _resizeHeader: function(text) {
    var cellMaxWidth = this.cellMaxWidth;
    if(cellMaxWidth !== "none") {
      cellMaxWidth = Number(cellMaxWidth.split('px')[0]);
      return cellMaxWidth < 60 || !text ? "-" : text.substr(0, (cellMaxWidth / 10) - 6 | 1) + '...';
    }
    return text;
  },

  _scaleColorFromChanged: function(newColor, oldColor) {
    if (newColor && newColor !== oldColor) {
      this._configChanged(this.config, {});
    }
  },

  _scaleColorToChanged: function(newColor, oldColor) {
    if (newColor && newColor !== oldColor) {
      this._configChanged(this.config, {});
    }
  },

  _hideRowHeaderChanged: function(nHide, oHide) {
    if (nHide !== undefined && nHide === false && nHide !== oHide && this.rows && (!this.rows.length || !this.rows[0])) this.hideRowHeader = true;
  },
  _showAggregationChanged: function(nShow, oShow) {
    if (nShow !== undefined && nShow != oShow) {
      this.set('showRowAggregation', nShow);
      this.set('showColAggregation', false);
      if (this.heatmapData[0] && this.heatmapData[0].length > 1) {
        this.set('showColAggregation', nShow);
      }
    }
  }
});
