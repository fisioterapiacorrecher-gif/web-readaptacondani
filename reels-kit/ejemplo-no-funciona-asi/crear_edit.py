import json,sys
sys.path.insert(0,'/home/user/web-readaptacondani/reels-kit/scripts'); from medir import fit
def L(t,a,red,txt=None): return [a,t,red,fit(a)]
E={"END":33.7,"video":"ENTRADA/video.mov","video_end":33.7,"salida_gain":0.5,
"hook":{"y0":692,"lh":134,"size":min(146,fit("TENDINITIS",146)),"end":2.25,"sfx_in":None,"sfx_out":None,"lines":[
  ["UNA",0.0,False],["TENDINITIS",0.27,True],["ES PARA",0.82,False],["TODA LA",1.23,False],["VIDA",1.65,True]]},
"looks":[{"st":0.0,"en":3.2,"fade_out":0.25,"contrast":1.15,"vignette":0.22}],
"keys":[
 {"st":2.31,"en":3.17,"style":"caps","lines":[["NO SE PUEDE",2.31,False,fit("NO SE PUEDE")],["CURAR",3.0,True,140]],"sfx_in":"error","sfx_out":None},
 {"st":20.59,"en":21.95,"style":"caps","lines":[["TOTALMENTE",20.59,False,fit("TOTALMENTE")],["ADAPTADO",21.16,True,140]],"sfx_in":None,"sfx":[["eureka",0.0,2.6]]},
 {"st":24.03,"en":24.75,"style":"caps","lines":[["ADIÓS A LA",24.03,False,fit("ADIÓS A LA")],["TENDINITIS",24.27,True,fit("TENDINITIS")]],"sfx_in":None,"sfx":[["bien",0.05]]},
 {"st":31.54,"en":33.7,"style":"caps","lines":[["ESCRIBE UN",31.54,False,fit("ESCRIBE UN")],["MENSAJE",31.97,False,140]],"y":1330,"glow":"red","sfx_out":None},
],
"cards":[],
"graphics":[
 {"module":"anim_lista","st":10.97,"en":17.75,"scene":"@1170;check:TRES FACTORES|FASE REAL|CARGA|OBJETIVO","pulses":[12.5,14.63,16.65],
  "blur":False,"hide_subs":True,"sfx_in":None,"sfx_out":None,"sfx":[["acierto",12.53,2.6],["acierto",14.66,2.6],["acierto",16.68,2.6]]}],
"graphic_cy":920,
"zoom":[[0.0,1.0,1.10,"L"],[3.17,1.0,1.0,"L"],[3.84,1.0,1.02,"L"],[6.6,1.05,1.07,"L"],[9.0,1.0,1.02,"L"],
 [10.97,1.0,1.0,"L"],[17.75,1.0,1.0,"L"],[18.07,1.0,1.02,"L"],[20.59,1.0,1.06,"S"],[22.0,1.0,1.02,"L"],
 [25.27,1.05,1.07,"L"],[27.23,1.05,1.10,"S"],[28.5,1.0,1.02,"L"],[30.6,1.05,1.07,"L"]]}
json.dump(E,open(sys.argv[1],"w"),ensure_ascii=False,indent=1)
print(E["hook"]["size"],[k["lines"] for k in E["keys"]])
