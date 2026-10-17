import json,sys
sys.path.insert(0,'/home/user/web-readaptacondani/reels-kit/scripts'); from medir import fit
E=json.load(open(sys.argv[1]))          # edit.json de la v2 (ya con los silencios recortados)
END=E["END"]
E["hook"]={"y0":692,"lh":134,"size":146,"end":0.0,"sfx_in":None,"sfx_out":None,"lines":[]}   # inicio con subtítulos normales
E["sfx"]=[["error",2.31,1.0]]           # "no se puede curar": el mensaje equivocado
E["keys"]=[
 {"st":20.10,"en":21.6,"style":"caps","lines":[["TOTALMENTE",20.10,False,fit("TOTALMENTE")],["ADAPTADO",20.62,True,140]],"sfx_in":None,"sfx":[["eureka",0.0,2.6]]},
 {"st":23.45,"en":24.2,"style":"caps","lines":[["ADIÓS A LA",23.45,False,fit("ADIÓS A LA")],["TENDINITIS",23.70,True,fit("TENDINITIS")]],"sfx_in":None,"sfx":[["bien",0.05]]}]
E["graphics"]=[
 {"module":"anim_lista","st":10.81,"en":17.5,"scene":"@1260;check:TRES FACTORES|FASE REAL|CARGA|OBJETIVO","pulses":[12.30,13.95,16.75],
  "blur":False,"hide_words":["tres","factores","fase","real","carga","objetivo"],"sfx_in":None,"sfx_out":None,
  "sfx":[["acierto",12.33,2.6],["acierto",13.98,2.6],["acierto",16.78,2.6]]},
 {"module":"anim_mensaje","st":30.6,"en":END+1,"scene":"Quiero volver a correr","pulses":[31.35,31.75],"blur":False,"sfx_out":None}]
z=[x for x in E["zoom"] if x[0]>=3.17]
E["zoom"]=[[0.0,1.0,1.12,"L"]]+[[3.17,1.0,1.0,"L"]]+[x for x in z if x[0]>3.17]
E["zoom"]=[x for x in E["zoom"] if not (10.81<x[0]<17.5)]
E["zoom"].append([10.81,1.0,1.0,"L"]); E["zoom"].sort()
json.dump(E,open(sys.argv[2],"w"),ensure_ascii=False,indent=1); print(E["zoom"])
