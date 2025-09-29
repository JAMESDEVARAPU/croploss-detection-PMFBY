import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  runApp(CropLossApp());
}

class CropLossApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Crop Loss Detection - PMFBY',
      theme: ThemeData(primarySwatch: Colors.green),
      home: CropAnalysisScreen(),
    );
  }
}

class CropAnalysisScreen extends StatefulWidget {
  @override
  _CropAnalysisScreenState createState() => _CropAnalysisScreenState();
}

class _CropAnalysisScreenState extends State<CropAnalysisScreen> {
  final _formKey = GlobalKey<FormState>();
  final SpeechToText _speechToText = SpeechToText();
  final FlutterTts _flutterTts = FlutterTts();
  
  double? latitude;
  double? longitude;
  double? fieldArea;
  String? cropType;
  String? mobile;
  String language = 'en';
  
  bool _isListening = false;
  String _voiceStep = '';
  bool _isVoiceMode = false;
  bool _isAnalyzing = false;
  
  Map<String, dynamic>? _analysis;

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  Future<void> _initializeServices() async {
    await Permission.microphone.request();
    await Permission.location.request();
    await _speechToText.initialize();
    await _flutterTts.setLanguage('en-US');
  }

  Future<void> _getCurrentLocation() async {
    try {
      Position position = await Geolocator.getCurrentPosition();
      setState(() {
        latitude = position.latitude;
        longitude = position.longitude;
      });
      _speak('GPS location found');
    } catch (e) {
      _speak('GPS failed. Please enter coordinates manually');
    }
  }

  Future<void> _speak(String text) async {
    await _flutterTts.speak(text);
  }

  void _startVoiceInput() {
    setState(() {
      _isVoiceMode = true;
      _voiceStep = 'latitude';
    });
    _speak('Voice form started. Please say the latitude coordinate');
    _startListening();
  }

  void _startListening() async {
    if (!_isListening) {
      bool available = await _speechToText.initialize();
      if (available) {
        setState(() => _isListening = true);
        _speechToText.listen(onResult: _onSpeechResult);
      }
    }
  }

  void _onSpeechResult(result) {
    String words = result.recognizedWords;
    _processVoiceInput(words);
  }

  void _processVoiceInput(String input) {
    switch (_voiceStep) {
      case 'latitude':
        double? lat = _extractNumber(input);
        if (lat != null) {
          setState(() => latitude = lat);
          _voiceStep = 'longitude';
          _speak('Latitude recorded. Now say longitude');
        }
        break;
      case 'longitude':
        double? lng = _extractNumber(input);
        if (lng != null) {
          setState(() => longitude = lng);
          _voiceStep = 'fieldArea';
          _speak('Longitude recorded. Now say field area');
        }
        break;
      case 'fieldArea':
        double? area = _extractNumber(input);
        if (area != null && area > 0) {
          setState(() => fieldArea = area);
          _voiceStep = 'cropType';
          _speak('Field area recorded. Now say crop type');
        }
        break;
      case 'cropType':
        String? crop = _extractCropType(input);
        if (crop != null) {
          setState(() => cropType = crop);
          _voiceStep = 'mobile';
          _speak('Crop type recorded. Now say mobile number');
        }
        break;
      case 'mobile':
        String? mob = _extractMobile(input);
        if (mob != null) {
          setState(() {
            mobile = mob;
            _isVoiceMode = false;
          });
          _speak('Form completed. Starting analysis');
          _analyzeOffline();
        }
        break;
    }
    
    if (_voiceStep.isNotEmpty) {
      Future.delayed(Duration(seconds: 2), () => _startListening());
    }
  }

  double? _extractNumber(String text) {
    RegExp regex = RegExp(r'([+-]?\d*\.?\d+)');
    Match? match = regex.firstMatch(text);
    return match != null ? double.tryParse(match.group(1)!) : null;
  }

  String? _extractCropType(String text) {
    String lower = text.toLowerCase();
    if (lower.contains('rice')) return 'rice';
    if (lower.contains('wheat')) return 'wheat';
    if (lower.contains('cotton')) return 'cotton';
    if (lower.contains('sugarcane')) return 'sugarcane';
    if (lower.contains('maize')) return 'maize';
    return null;
  }

  String? _extractMobile(String text) {
    String numbers = text.replaceAll(RegExp(r'\D'), '');
    return numbers.length >= 10 ? numbers.substring(numbers.length - 10) : null;
  }

  Future<void> _analyzeOffline() async {
    setState(() => _isAnalyzing = true);
    
    // Offline ML analysis simulation
    await Future.delayed(Duration(seconds: 2));
    
    double lossPercentage = 35.0 + (latitude! * longitude!).abs() % 30;
    bool eligible = lossPercentage >= 33;
    double compensation = eligible ? fieldArea! * lossPercentage * 500 : 0;
    
    setState(() {
      _analysis = {
        'lossPercentage': lossPercentage,
        'pmfbyEligible': eligible,
        'compensationAmount': compensation,
        'confidence': 92,
        'village': 'Sample Village',
        'district': 'Sample District',
      };
      _isAnalyzing = false;
    });
    
    _speak(eligible ? 'Analysis complete. You are eligible for compensation' : 'Analysis complete. Not eligible for compensation');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Crop Loss Detection - PMFBY'),
        backgroundColor: Colors.green,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Text('GPS Location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _getCurrentLocation,
                              icon: Icon(Icons.location_on),
                              label: Text('Get GPS'),
                            ),
                          ),
                          SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: _startVoiceInput,
                            icon: Icon(Icons.mic),
                            label: Text('Voice'),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
              SizedBox(height: 16),
              
              Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              decoration: InputDecoration(labelText: 'Latitude'),
                              keyboardType: TextInputType.number,
                              initialValue: latitude?.toString(),
                              onChanged: (value) => latitude = double.tryParse(value),
                            ),
                          ),
                          SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              decoration: InputDecoration(labelText: 'Longitude'),
                              keyboardType: TextInputType.number,
                              initialValue: longitude?.toString(),
                              onChanged: (value) => longitude = double.tryParse(value),
                            ),
                          ),
                        ],
                      ),
                      
                      SizedBox(height: 16),
                      
                      TextFormField(
                        decoration: InputDecoration(labelText: 'Field Area (hectares)'),
                        keyboardType: TextInputType.number,
                        onChanged: (value) => fieldArea = double.tryParse(value),
                      ),
                      
                      SizedBox(height: 16),
                      
                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(labelText: 'Crop Type'),
                        value: cropType,
                        items: ['rice', 'wheat', 'cotton', 'sugarcane', 'maize']
                            .map((crop) => DropdownMenuItem(value: crop, child: Text(crop.toUpperCase())))
                            .toList(),
                        onChanged: (value) => setState(() => cropType = value),
                      ),
                      
                      SizedBox(height: 16),
                      
                      TextFormField(
                        decoration: InputDecoration(labelText: 'Mobile Number'),
                        keyboardType: TextInputType.phone,
                        onChanged: (value) => mobile = value,
                      ),
                      
                      SizedBox(height: 24),
                      
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isAnalyzing ? null : _analyzeOffline,
                          child: _isAnalyzing 
                              ? CircularProgressIndicator(color: Colors.white)
                              : Text('Analyze Crop Loss (Offline)'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            padding: EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              if (_analysis != null) ...[
                SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Analysis Results', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        SizedBox(height: 16),
                        
                        Row(
                          children: [
                            Icon(Icons.assessment, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Crop Loss: ${_analysis!['lossPercentage'].toStringAsFixed(1)}%', 
                                 style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        
                        SizedBox(height: 8),
                        
                        Row(
                          children: [
                            Icon(_analysis!['pmfbyEligible'] ? Icons.check_circle : Icons.cancel, 
                                 color: _analysis!['pmfbyEligible'] ? Colors.green : Colors.red),
                            SizedBox(width: 8),
                            Text(_analysis!['pmfbyEligible'] ? 'PMFBY Eligible' : 'Not Eligible',
                                 style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        
                        if (_analysis!['pmfbyEligible']) ...[
                          SizedBox(height: 8),
                          Text('Compensation: ₹${_analysis!['compensationAmount'].toStringAsFixed(0)}',
                               style: TextStyle(fontSize: 16, color: Colors.green, fontWeight: FontWeight.bold)),
                        ],
                        
                        SizedBox(height: 16),
                        Text('Location: ${_analysis!['village']}, ${_analysis!['district']}'),
                        Text('Confidence: ${_analysis!['confidence']}%'),
                        Text('Analysis Mode: Flutter Offline'),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}