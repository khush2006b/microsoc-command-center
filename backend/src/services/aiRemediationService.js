// AI-Powered Remediation Engine
// Generates context-aware security remediation using LLMs
// Supports: Gemini, OpenAI, Groq, Ollama

import axios from 'axios';
import redis from './redisClient.js';

// Configuration

const LLM_CONFIG = {
  provider: process.env.LLM_PROVIDER || 'gemini', // gemini, openai, groq, ollama
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ,
    model: 'gemini-1.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'llama-3.1-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },
  
  ollama: {
    model: 'llama3',
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate'
  }
};

const CACHE_TTL = 3600; // 1 hour cache
const MAX_RETRIES = 2;

// Build SOC remediation prompt with industry standards
function buildRemediationPrompt(incident, alerts) {
  const primaryAlert = alerts && alerts.length > 0 ? alerts[0] : null;
  
  const attackType = incident.attack_type || 'unknown';
  const severity = incident.severity || 'medium';
  const sourceIP = incident.metadata?.src_ip || 'unknown';
  const targetSystem = incident.metadata?.dest_system || 'unknown';
  const geo = incident.metadata?.geo || {};
  
  // Extract payload/pattern from alerts
  let attackPattern = 'Not available';
  if (primaryAlert) {
    attackPattern = primaryAlert.pattern_matched || 
                   primaryAlert.evidence?.payload || 
                   primaryAlert.metadata?.payload || 
                   'Standard attack pattern detected';
  }
  
  const prompt = `You are an expert cybersecurity analyst working in a Security Operations Center (SOC). You must provide comprehensive, actionable remediation guidance for the following security incident.

🔴 INCIDENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Incident ID: ${incident.incident_id}
Title: ${incident.title}
Attack Type: ${attackType.toUpperCase().replace('_', ' ')}
Severity: ${severity.toUpperCase()}
Status: ${incident.status}

Source Information:
- IP Address: ${sourceIP}
- Country: ${geo.country || 'Unknown'}
- City: ${geo.city || 'Unknown'}

Target System: ${targetSystem}
Attack Pattern: ${attackPattern}

Description:
${incident.description}

Alert Count: ${alerts?.length || 0}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 YOUR TASK:
Generate a comprehensive remediation plan following industry standards (OWASP, MITRE ATT&CK, NIST Cybersecurity Framework, CIS Controls).

⚠️ CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown formatting, no explanations, no code blocks. Just pure JSON.

Required JSON Structure:
{
  "summary": "Brief executive summary of the incident and its impact (2-3 sentences)",
  "risk_level": "CRITICAL|HIGH|MEDIUM|LOW - with brief justification",
  "immediate_actions": [
    "Action 1: Specific, actionable step",
    "Action 2: Another specific step",
    "Action 3: Include commands/configurations where applicable"
  ],
  "long_term_actions": [
    "Strategic improvement 1",
    "Policy/procedure update 2",
    "Infrastructure hardening 3"
  ],
  "recommended_tools": [
    "Tool 1: Purpose and usage",
    "Tool 2: Another relevant tool"
  ],
  "reference_standards": [
    "MITRE ATT&CK Technique: [ID] - [Name]",
    "OWASP Top 10: [Category]",
    "NIST CSF: [Function].[Category]",
    "CIS Control: [Number] - [Title]"
  ],
  "automation_opportunities": [
    "WAF rule to block this pattern",
    "SIEM correlation rule",
    "IPS signature update"
  ],
  "indicators_of_compromise": [
    "IP: ${sourceIP}",
    "Attack signature: [pattern]",
    "User-Agent/Tool: [if known]"
  ]
}

IMPORTANT GUIDELINES:
1. Immediate actions should be executable within 15 minutes by SOC analyst
2. Include specific commands, firewall rules, or configurations where applicable
3. Reference real MITRE ATT&CK techniques (e.g., T1190 for Exploit Public-Facing Application)
4. Map to relevant OWASP Top 10 categories
5. Cite specific CIS Controls (e.g., CIS Control 13: Network Monitoring)
6. Be technical and precise - this is for security professionals
7. Consider the attack type: ${attackType}
8. Tailor response to severity: ${severity}

Return ONLY the JSON object. No additional text.`;

  return prompt;
}

// LLM API Calls
async function callGemini(prompt) {
  const config = LLM_CONFIG.gemini;
  
  try {
    const response = await axios.post(
      `${config.endpoint}?key=${config.apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3, // Low temperature for consistent, factual responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );
    
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    
    console.log('✅ Gemini API response received');
    return text;
    
  } catch (error) {
    console.error('❌ Gemini API error:', error.response?.data || error.message);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
}

async function callOpenAI(prompt) {
  const config = LLM_CONFIG.openai;
  
  if (!config.apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const response = await axios.post(
      config.endpoint,
      {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert cybersecurity analyst. Respond only with valid JSON, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 30000
      }
    );
    
    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from OpenAI');
    }
    
    console.log('✅ OpenAI API response received');
    return text;
    
  } catch (error) {
    console.error('❌ OpenAI API error:', error.response?.data || error.message);
    throw new Error(`OpenAI API failed: ${error.message}`);
  }
}

async function callLLM(prompt) {
  const provider = LLM_CONFIG.provider;
  
  console.log(`🤖 Calling ${provider.toUpperCase()} for remediation generation...`);
  
  switch (provider) {
    case 'gemini':
      return await callGemini(prompt);
    case 'openai':
      return await callOpenAI(prompt);
    case 'groq':
      // Similar to OpenAI structure
      return await callOpenAI(prompt); // Can use same client
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

// Extract and parse JSON from LLM response
function parseRemediationJSON(llmResponse) {
  try {
    // Remove markdown code blocks if present
    let jsonText = llmResponse.trim();
    
    // Remove ```json and ``` markers
    jsonText = jsonText.replace(/```json\s*/g, '');
    jsonText = jsonText.replace(/```\s*/g, '');
    
    // Find JSON object boundaries
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('No JSON object found in response');
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    // Parse JSON
    const remediation = JSON.parse(jsonText);
    
    // Validate required fields
    const requiredFields = [
      'summary',
      'risk_level',
      'immediate_actions',
      'long_term_actions',
      'recommended_tools',
      'reference_standards'
    ];
    
    for (const field of requiredFields) {
      if (!remediation[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Ensure arrays are arrays
    const arrayFields = [
      'immediate_actions',
      'long_term_actions',
      'recommended_tools',
      'reference_standards'
    ];
    
    for (const field of arrayFields) {
      if (!Array.isArray(remediation[field])) {
        remediation[field] = [remediation[field]];
      }
    }
    
    console.log('✅ Remediation JSON parsed and validated');
    return remediation;
    
  } catch (error) {
    console.error('❌ JSON parsing failed:', error.message);
    console.error('Raw response:', llmResponse.substring(0, 500));
    throw new Error(`Failed to parse remediation JSON: ${error.message}`);
  }
}

// Generate basic fallback remediation if LLM fails
function generateFallbackRemediation(incident) {
  const attackType = incident.attack_type || 'unknown';
  
  const fallbacks = {
    sql_injection: {
      summary: 'SQL Injection attack detected. Immediate action required to prevent database compromise.',
      risk_level: 'CRITICAL - SQL Injection can lead to complete database compromise, data theft, and system takeover.',
      immediate_actions: [
        'Block source IP: ' + (incident.metadata?.src_ip || 'unknown'),
        'Review and sanitize all SQL queries in affected application',
        'Enable prepared statements and parameterized queries',
        'Check database logs for unauthorized access or data exfiltration',
        'Temporarily disable affected endpoints if possible'
      ],
      long_term_actions: [
        'Implement Web Application Firewall (WAF) with SQL injection rules',
        'Deploy static code analysis tools to detect SQL injection vulnerabilities',
        'Conduct security training for developers on secure coding practices',
        'Implement least-privilege database access controls',
        'Enable database query logging and monitoring'
      ],
      recommended_tools: [
        'ModSecurity WAF: Deploy with OWASP Core Rule Set',
        'SQLMap: Test for additional SQL injection vectors',
        'Burp Suite: Comprehensive web application security testing'
      ],
      reference_standards: [
        'MITRE ATT&CK: T1190 - Exploit Public-Facing Application',
        'OWASP Top 10: A03:2021 - Injection',
        'NIST CSF: PR.DS-5 - Protections against data leaks',
        'CIS Control 16: Application Software Security'
      ]
    },
    
    xss: {
      summary: 'Cross-Site Scripting (XSS) attack detected. User sessions and data at risk.',
      risk_level: 'HIGH - XSS can lead to session hijacking, credential theft, and malware distribution.',
      immediate_actions: [
        'Block source IP: ' + (incident.metadata?.src_ip || 'unknown'),
        'Sanitize user input and implement output encoding',
        'Review and update Content Security Policy (CSP) headers',
        'Check for compromised user sessions',
        'Scan affected pages for malicious scripts'
      ],
      long_term_actions: [
        'Implement input validation framework',
        'Deploy Content Security Policy (CSP) across all pages',
        'Use HTTPOnly and Secure flags on cookies',
        'Regular security code reviews',
        'Implement automated XSS scanning in CI/CD pipeline'
      ],
      recommended_tools: [
        'OWASP ZAP: Automated XSS detection',
        'DOMPurify: Client-side XSS sanitization library',
        'CSP Evaluator: Test Content Security Policy effectiveness'
      ],
      reference_standards: [
        'MITRE ATT&CK: T1059.007 - JavaScript',
        'OWASP Top 10: A03:2021 - Injection (XSS)',
        'NIST CSF: PR.DS-5 - Protections against data leaks',
        'CIS Control 16: Application Software Security'
      ]
    },
    
    brute_force: {
      summary: 'Brute force attack detected. Authentication system under attack.',
      risk_level: 'HIGH - Successful brute force can lead to unauthorized access and account compromise.',
      immediate_actions: [
        'Block source IP: ' + (incident.metadata?.src_ip || 'unknown'),
        'Implement rate limiting on login endpoints',
        'Enable CAPTCHA on login forms',
        'Force password reset for targeted accounts',
        'Review authentication logs for successful breaches'
      ],
      long_term_actions: [
        'Implement account lockout policy (e.g., 5 failed attempts)',
        'Deploy Multi-Factor Authentication (MFA)',
        'Monitor for credential stuffing attacks',
        'Implement passwordless authentication options',
        'Use risk-based authentication'
      ],
      recommended_tools: [
        'Fail2Ban: Automatic IP blocking for failed attempts',
        'Azure AD Identity Protection: Advanced threat detection',
        'Okta: Enterprise identity and access management'
      ],
      reference_standards: [
        'MITRE ATT&CK: T1110 - Brute Force',
        'OWASP: Authentication and Session Management',
        'NIST SP 800-63B: Digital Identity Guidelines',
        'CIS Control 6: Access Control Management'
      ]
    },
    
    port_scan: {
      summary: 'Port scanning activity detected. Reconnaissance phase of potential attack.',
      risk_level: 'MEDIUM - Port scans indicate attacker reconnaissance, often precursor to exploitation.',
      immediate_actions: [
        'Block source IP: ' + (incident.metadata?.src_ip || 'unknown'),
        'Review firewall rules and close unnecessary ports',
        'Enable network intrusion detection',
        'Monitor for follow-up exploitation attempts',
        'Document scanning patterns for threat intelligence'
      ],
      long_term_actions: [
        'Implement port knocking or similar stealth techniques',
        'Deploy network segmentation',
        'Use intrusion prevention system (IPS)',
        'Regularly audit open ports and services',
        'Implement honeypots to detect attackers'
      ],
      recommended_tools: [
        'Snort/Suricata: Network intrusion detection',
        'Nmap: Verify exposed services',
        'Shodan: Check external exposure'
      ],
      reference_standards: [
        'MITRE ATT&CK: T1046 - Network Service Discovery',
        'NIST CSF: DE.CM-1 - Network monitoring',
        'CIS Control 13: Network Monitoring and Defense'
      ]
    }
  };
  
  const fallback = fallbacks[attackType] || {
    summary: `Security incident of type ${attackType} detected. Immediate investigation required.`,
    risk_level: 'MEDIUM - Unknown attack type requires manual analysis.',
    immediate_actions: [
      'Block source IP: ' + (incident.metadata?.src_ip || 'unknown'),
      'Isolate affected systems',
      'Collect forensic evidence',
      'Review logs for indicators of compromise'
    ],
    long_term_actions: [
      'Conduct thorough security assessment',
      'Update security policies and procedures',
      'Implement additional monitoring'
    ],
    recommended_tools: [
      'Security Information and Event Management (SIEM)',
      'Endpoint Detection and Response (EDR)'
    ],
    reference_standards: [
      'NIST Cybersecurity Framework',
      'ISO 27001: Information Security Management'
    ]
  };
  
  // Add optional fields with defaults
  fallback.automation_opportunities = fallback.automation_opportunities || [
    'Create SIEM correlation rule for this attack pattern',
    'Update firewall blacklist with attacker IP',
    'Deploy automated blocking for similar patterns'
  ];
  
  fallback.indicators_of_compromise = fallback.indicators_of_compromise || [
    'Source IP: ' + (incident.metadata?.src_ip || 'unknown'),
    'Attack Type: ' + attackType,
    'Target: ' + (incident.metadata?.dest_system || 'unknown')
  ];
  
  return fallback;
}

// Main remediation generation function
export async function generateRemediation(incident, alerts = []) {
  try {
    const incidentId = incident._id.toString();
    const cacheKey = `remediation:${incidentId}`;
    
    // Check Redis cache first
    console.log(`🔍 Checking cache for incident ${incident.incident_id}...`);
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('✅ Returning cached remediation');
      return JSON.parse(cached);
    }
    
    console.log(`🤖 Generating AI remediation for ${incident.incident_id}...`);
    
    // Build prompt
    const prompt = buildRemediationPrompt(incident, alerts);
    
    let remediation;
    let retries = 0;
    
    // Retry logic for LLM calls
    while (retries < MAX_RETRIES) {
      try {
        // Call LLM
        const llmResponse = await callLLM(prompt);
        
        // Parse and validate JSON
        remediation = parseRemediationJSON(llmResponse);
        
        // Add metadata
        remediation.generated_at = new Date();
        remediation.generated_by = 'AI Engine (' + LLM_CONFIG.provider + ')';
        remediation.incident_id = incident.incident_id;
        
        break; // Success, exit retry loop
        
      } catch (error) {
        retries++;
        console.error(`❌ Attempt ${retries} failed:`, error.message);
        
        if (retries >= MAX_RETRIES) {
          console.warn('⚠️ Max retries reached, using fallback remediation');
          remediation = generateFallbackRemediation(incident);
          remediation.generated_at = new Date();
          remediation.generated_by = 'Fallback System';
          remediation.incident_id = incident.incident_id;
          remediation.is_fallback = true;
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }
    }
    
    // Cache the result
    await redis.set(cacheKey, JSON.stringify(remediation), 'EX', CACHE_TTL);
    console.log(`✅ Remediation generated and cached for ${incident.incident_id}`);
    
    return remediation;
    
  } catch (error) {
    console.error('❌ Remediation generation failed:', error);
    
    // Ultimate fallback
    const fallback = generateFallbackRemediation(incident);
    fallback.generated_at = new Date();
    fallback.generated_by = 'Emergency Fallback';
    fallback.incident_id = incident.incident_id;
    fallback.is_fallback = true;
    fallback.error = error.message;
    
    return fallback;
  }
}

// Clear cached remediation for incident
export async function clearRemediationCache(incidentId) {
  const cacheKey = `remediation:${incidentId}`;
  await redis.del(cacheKey);
  console.log(`🗑️ Cleared remediation cache for ${incidentId}`);
}

export default {
  generateRemediation,
  clearRemediationCache
};
