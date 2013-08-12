/*!
 * date-range-parser.js
 * Contributed to the Apache Software Foundation by:
 *    Ben Birch - Aconex
 * fork me at https://github.com/mobz/date-range-parser

Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.

*/

(function() {

	var drp = window.dateRangeParser = {};

	drp.defaultRange = 1000 * 60 * 60 * 24;

	drp.now = null; // set a different value for now than the time at function invocation

	drp.parse = function(v) {
		try {
			var r = drp._parse(v);
			r.end && r.end--; // remove 1 millisecond from the final end range
		} catch(e) {
			r = null;
		}
		return r;
	};

	drp.print = function(t, p) {
		var format = ["", "-", "-", " ", ":", ":", "."];
		var da = makeArray(t);
		var str = "";
		for(var i = 0; i <= p; i++) {
			str += format[i] + (da[i] < 10 ? "0" : "") + da[i];
		}
		return str;
	};

	(function() {
		drp._relTokens = {};

		var values = {
			"yr"  : 365*24*60*60*1000,
			"mon" : 31*24*60*60*1000,
			"day" : 24*60*60*1000,
			"hr"  : 60*60*1000,
			"min" : 60*1000,
			"sec" : 1000
		};

		var alias_lu = {
			"yr" : "y,yr,yrs,year,years",
			"mon" : "mo,mon,mos,mons,month,months",
			"day" : "d,dy,dys,day,days",
			"hr" : "h,hr,hrs,hour,hours",
			"min" : "m,min,mins,minute,minutes",
			"sec" : "s,sec,secs,second,seconds"
		};

		for(var key in alias_lu) {
			if(alias_lu.hasOwnProperty(key)) {
				var aliases = alias_lu[key].split(",");
				for(var i = 0; i < aliases.length; i++) {
					drp._relTokens[aliases[i]] = values[key];
				}
			}
		}
	})();

	function makeArray(d) {
		var da = new Date(d);
		return [ da.getUTCFullYear(), da.getUTCMonth()+1, da.getUTCDate(), da.getUTCHours(), da.getUTCMinutes(), da.getUTCSeconds(), da.getUTCMilliseconds() ];
	}

	function fromArray(a) {
		var d = [].concat(a); d[1]--;
		return Date.UTC.apply(null, d);
	}

	drp._parse = function parse(v) {
		var now = this.now || new Date().getTime();

		function precArray(d, p, offset) {
			var tn = makeArray(d);
			tn[p] += offset || 0;
			for(var i = p+1; i < 7; i++) {
				tn[i] = i < 3 ? 1 : 0;
			}
			return tn;
		}
		function makePrecRange(dt, p, r) {
			var ret = { };
			ret.start = fromArray(dt);
			dt[p] += r || 1;
			ret.end = fromArray(dt);
			return ret;
		}
		function procTerm(term) {
			var m = term.replace(/\s/g, "").toLowerCase().match(/^([a-z ]+)$|^([ 0-9:-]+)$|^(\d+[a-z]+)$/);
			if(m[1]) {	// matches ([a-z ]+)
				function dra(p, o, r) {
					var dt = precArray(now, p, o);
					if(r) {
						dt[2] -= new Date(fromArray(dt)).getUTCDay();
					}
					return makePrecRange(dt, p, r);
				}
				switch( m[1]) {
					case "now" : return { start: now, end: now, now: now };
					case "today" : return dra( 2, 0 );
					case "thisweek" : return dra( 2, 0, 7 );
					case "thismonth" : return dra( 1, 0 );
					case "thisyear" : return dra( 0, 0 );
					case "yesterday" : return dra( 2, -1 );
					case "lastweek" : return dra( 2, -7, 7 );
					case "lastmonth" : return dra( 1, -1 );
					case "lastyear" : return dra( 0, -1 );
					case "tomorrow" : return dra( 2, 1 );
					case "nextweek" : return dra( 2, 7, 7 );
					case "nextmonth" : return dra( 1, 1 );
					case "nextyear" : return dra(0, 1 );
				}
				throw "unknown token " +  m[1];
			} else if(m[2]) { // matches ([ 0-9:-]+)
				dn = makeArray(now);
				var dt = m[2].match(/^(?:(\d{4})(?:\-(\d\d))?(?:\-(\d\d))?)? ?(?:(\d{1,2})(?:\:(\d\d)(?:\:(\d\d))?)?)?$/);
				dt.shift();
				for(var p = 0, z = false, i = 0; i < 7; i++) {
					if(dt[i]) {
						dn[i] = parseInt(dt[i], 10);
						p = i;
						z = true;
					} else {
						if(z)
							dn[i] = i < 3 ? 1 : 0;
					}
				}
				return makePrecRange(dn, p);
			} else if(m[3]) { // matches (\d+[a-z]{1,4})
				var dr = m[3].match(/(\d+)\s*([a-z]+)/i);
				var n = parseInt(dr[1], 10);
				return { rel: n * drp._relTokens[dr[2]] };
			}
			throw "unknown term " + term;
		}

		if(!v) {
			return { start: null, end: null };
		}
		var terms = v.split(/\s*([^<>]*[^<>-])?\s*(->|<>|<)?\s*([^<>]+)?\s*/);

		var term1 = terms[1] ? procTerm(terms[1]) : null;
		var op = terms[2] || "";
		var term2 = terms[3] ? procTerm(terms[3]) : null;

		if(op === "<" || op === "->" ) {
			if(term1 && !term2) {
				return { start: term1.start, end: null };
			} else if(!term1 && term2) {
				return { start: null, end: term2.end };
			} else {
				if(term2.rel) {
					return { start: term1.start, end: term1.end + term2.rel };
				} else if(term1.rel) {
					return { start: term2.start - term1.rel, end: term2.end };
				} else {
					return { start: term1.start, end: term2.end };
				}
			}
		} else if(op === "<>") {
			if(!term2) {
				return { start: term1.start - drp.defaultRange, end: term1.end + drp.defaultRange }
			} else {
				if(! ("rel" in term2)) throw "second term did not hav a range";
				return { start: term1.start - term2.rel, end: term1.end + term2.rel };
			}
		} else {
			if(term1.rel) {
				return { start: now - term1.rel, end: now + term1.rel };
			} else if(term1.now) {
				return { start: term1.now - drp.defaultRange, end: term1.now + drp.defaultRange };
			} else {
				return { start: term1.start, end: term1.end };
			}
		}
		throw "could not process value " + v;
	};
})();